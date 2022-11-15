const { Client } = require('yapople');
const nodemailer = require('nodemailer');
const fs = require('fs');
var moment = require('moment');
var sha256 = require('sha-256-js');
let emlformat = require('eml-format');
const  EmlParser = require('eml-parser');
const inicioModelo = require ('../model/inicio.modelo.js');
let noPermitidos = [];
let horarioDeServicio = []
let emailActivos = [];

module.exports = {

  vista : async (req,res) =>{
    res.render('lateral.ejs');
  },
  inicio: async (req, res) => {
    //validar que no haya morido la sesion
    if( typeof req.session.id_personal === 'undefined' ) {
      res.redirect('/');
    } else {
      //carga de valores para hacer mas dinamico el servicio.
      noPermitidos = [];
      horarioDeServicio = [];
      //obtener la ultima hora de correo recibido.
      var lastMail = await inicioModelo.getLastMailDb();
      if(lastMail.length > 0 ){ checkHour = lastMail[0].receivedDate; } 
      else { checkHour =  moment().format('YYYY-MM-DD') + ' 07:00:00'; }

      //lenar el array de no permitidos mediante archivo.
      var listanegra = fs.readFileSync('./config/listanegra.txt','utf-8')
      var wrongMails = listanegra.replaceAll(/\t|\r/g,'').split('\n');
      wrongMails.forEach( item =>{
        noPermitidos.push( item.trim() )
      })

      //lenar el array de no permitidos mediante archivo.
      var horario = fs.readFileSync('./config/horario.txt','utf-8')
      var timeServices = horario.replaceAll(/\t|\r/g,'').split('\n');
      timeServices.forEach( item =>{
        horarioDeServicio.push( item.replaceAll('time=','').trim() )
      })

      //carga los correos que van a servir:
      var respuesta = obtenerArchivosEmailYSuContenido(tipo='pop');
      respuesta.forEach( item =>{ emailActivos.push(item.archivo) });
      res.render('inicio.ejs', { 
        title: 'Inicio' ,
        'correos' : emailActivos ,
        "usuario" : req.session.usuario,
        "nombrecompleto":  req.session.nombre_completo  
      });
    }
  },
  inboxNew : async (req,res)=>{
    if(typeof req.session.id_personal === "undefined"){
      res.json({"message":"/salir"})
      res.end();
      return
    }

    //validar si ya paso el minuto para hacer la solicitud nuevamente:
    if(typeof req.session.checkInboxTime === "undefined"){
      req.session.checkInboxTime = moment().add(20,'seconds').format('HH:mm:ss');
      console.log("esta es la nueva sesion:", req.session.checkInboxTime)
    } else {
      var nowCheck = moment().format('YYYY-MM-DD HH:mm:ss');
      var timesesion =  moment().format('YYYY-MM-DD') + " " + req.session.checkInboxTime;
      if(  new Date(nowCheck).getTime() < new Date(timesesion).getTime() ){
        res.json({"message": "is not time"})
        res.end();
        return
      } else {
        req.session.checkInboxTime = moment().add(1,'minutes').format('HH:mm:ss');
      }
    }

    let usernameFile,passwordFile;
    try {
      let archivo = fs.readFileSync(`./config/${req.body.archivo}`, 'utf-8');
      var infoMail = archivo.replaceAll(/\r/g,'').split('\n');
      for(var x=0; x<infoMail.length; x++){
        switch(infoMail[x].split('=')[0].toString('utf-8')){
          case 'username': usernameFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
          case 'password': passwordFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
        }
      }
    } catch (error) {
      console.log("error de archivo email",error)
    }
    
    var client = new Client({
      host: 'pop.telcel.com',
      port: 110,
      tls: false,
      ssl: false,
      mailparser: false,
      username: usernameFile,
      password: passwordFile
    });
    
    var sinMensajes = "Error: No such message";
    var bandera = false;
    try {
      await client.connect();
      cuantos = await  client.count()
      var msgs = await client.retrieve(cuantos);
      var rutaEmails = `./emails/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}/`;
      var rutaAttach = `./attachments/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}/`;
      var emailName = `email_${moment().format('YYYYMMDDHHmmss')}`

      //validar si existe la ruta:
      if(fs.statSync(`${rutaEmails}`).isDirectory()){
        //se guarda el correo:
        fs.writeFileSync(`${rutaEmails}/${emailName}.eml`,msgs,'utf-8', (err)=>{
          if(err){
            console.log(err)
          }
        })
      } else {
        //crea directorio y luego inserta:
        fs.mkdirSync(rutaEmails);
        if(fs.statSync(`${rutaEmails}`).isDirectory()){
          //se guarda el correo:
          fs.writeFileSync(`${rutaEmails}/${emailName}.eml`,msgs,'utf-8', (err)=>{
            if(err){
              console.log("error mkdir/",err)
            }
          })
        }
      }
      
      if(fs.existsSync(`${rutaEmails}/${emailName}.eml`,'utf-8')){
        //se procede a revisar si es aceptado o no:
        var eml = fs.readFileSync(`${rutaEmails}/${emailName}.eml`, "utf-8");
        emlformat.read(eml,{ headersOnly : true },(error, data)=>{
          if (!error){  lec = data }
        });

        var headers_ = JSON.stringify(lec.headers).replaceAll(/-/g,'');
        var datosAValidar = JSON.parse(headers_);
        var de="";
        if(datosAValidar.From.indexOf('<') > -1){
          var restos = datosAValidar.From.split('<')[1].slice(0,-1);
          de = restos;
        } else {
          de = datosAValidar.From;
        }    
        //lectura de el archivo, validamos si esta permitido conservar o no:
        var evualuar = {
          "receivedDate" : moment(new Date( Date.parse(datosAValidar.Date))).format('YYYY-MM-DD HH:mm:ss'),
          "messageid" :  datosAValidar.Messageid.replaceAll(/<|>/g,''),
          "findEmail" : de,
          "subject": lec.subject
        }
        var existe = await inicioModelo.getUniqueMessageId(evualuar);

        //buscar si no existe en la lista negra:
        var bloqueado_ = noPermitidos.find( item =>{
          return item.toLowerCase() === de.toLowerCase()
        })

        console.log("hay en base",existe.length,"o","esta bloqueado",de," = ",bloqueado_,)
        if(existe.length == 0 && typeof bloqueado_ === "undefined"){
          //no hay ingresalo:
          var newMessage = {
            'folioemail' : evualuar.findEmail.split('@')[0] + generateUUID(),
            "rutaFile": rutaEmails,
            'asunto': evualuar.subject,
            'findEmail': evualuar.findEmail,
            "recibe" : usernameFile,
            'messageid': evualuar.messageid,
            'receiveDate': evualuar.receivedDate,
            'ex':"",
            'fuerzadeventas':"",
            'estado':"new",
            'codificacion':"",
            'fechaActualizacion':"",
            'respuesta':"",
            'filesend': ""
          }
          //ingresar a base:
          var saveResponse = await inicioModelo.saveNewEmal(newMessage);
          //si lo crea devuelve 1:
          if(saveResponse > 0 ){
            //copia y emimina el antiguo:
            fs.renameSync(`${rutaEmails}/${emailName}.eml`,`${rutaEmails}/${newMessage.folioemail}.eml`,(err)=>{
              if(err){
                console.log(err)
              }
            })
            var resp = await client.delete(cuantos)
            console.log(resp);
            await client.quit();
            res.json({"message": "save"})
          } else {
            await client.quit();
            res.json({"message": "no save"})
          }
        } else {
          //ya existe eliminalo por puto:
          fs.rm(`${rutaEmails}/${emailName}.eml`,(err)=>{
            if(err){
              console.log(err)
            } else {
              console.log("Se elmino archivo existente en base:")
            }
          })
          var resp = await client.delete(cuantos)
          console.log(resp);
          await client.quit();
          res.json({"message": "delete"})
        }
      } else {
        await client.quit();
        res.json({"message": "Not found"})
      }
    }catch(err){
      await client.quit();
      console.log(err.toString());
      if(err.toString() === "Error: No such message"){
        bandera = true;
      }
      res.status('200').json({"message": sinMensajes })
      res.end();
      return;
    }
  },
  getMailDb : async (req,res)=>{
    //buscar en base de datos:
    var listaMensajes = await inicioModelo.getAllMailDataBase({ estado : req.body.estado , "limit" : req.body.limit });
    res.json({"listaMensajes": listaMensajes });
  },
  getRespuestaEnviada : async(req,res)=>{
    let mime = require('mime');
    var info = await inicioModelo.getRespuestaEnviada({ id : req.body.id  });
    //buscar los archivos enviados y mostrarlos:
    var archivos = []
    if(info.length> 0){
      //busca si existe files:
      if(info[0].filesend !== ""){
        var cualesArchivos = fs.readdirSync(info[0].filesend,'utf-8');
        console.log(cualesArchivos)
        if(cualesArchivos.length > 0 ){
          for(var x=0; x<cualesArchivos.length; x++){
            var datos = fs.readFileSync(`${info[0].filesend}/${cualesArchivos[x]}`);
            //obtenido el los elementos se tranforman archivo en buffer arrays
            var insertaDatos = {
              "filename" : cualesArchivos[x] ,
              "buffer" : datos,
              "contentType" : mime.getType(`${info[0].filesend}/${cualesArchivos[x]}`)
            }
            archivos.push(insertaDatos);
          }
        }
      } 
    }
    res.json({"info": info, "filesend" : archivos });
  },
  getFileEmail : async (req,res)=>{

    //check if file exist:
    if(fs.existsSync(`${req.body.ruta}.eml`,'utf-8')){
      var html = await new EmlParser(fs.createReadStream( `${req.body.ruta}.eml`))
      .getEmailBodyHtml()
      .then(htmlString  => {
        return htmlString;
      })
      .catch(err  => {
        console.log(err);
      })

      var attach = await new EmlParser(fs.createReadStream(`${req.body.ruta}.eml`))
      .getEmailAttachments()
      .then(attachments  => {
        if(attachments.length > 0){
          return attachments;
        }
      })
      .catch(err  => {
        console.log(err);
      })

      res.json({"error": 0,"html": html, "attach": attach })
    } else {
      res.json({"error": 1,'html': 
      `<h3 class="subtitle is-3">
        Not found file:${req.body.ruta}.eml
      </h3>
      <p>Posible Duplicado</p>
      <br>
      <button  class="button is-danger" onclick="borrarEmailDuplicado(${req.body.id}); return false;" >
        <i class="ti-trash"></i>
        Borrar
      </button>` });
    }
  },
  findEmailByIdAndSubject : async(req,res)=>{
    //buscar en base de datos:
    var listaMensajes = await inicioModelo.findEmailByIdAndSubject({ estado : req.body.estado , entrada : req.body.entrada });
    res.json({"listaMensajes": listaMensajes });
  },
  borrarId : async (req,res)=>{
    var resultado = await inicioModelo.borrarId({"id" :  req.body.id});
    if(resultado > 0){
      res.json({
        "message" : "delete"
      })
    } else{
      res.json({
        "message" : resultado
      })
    }
  },
  responderA : async (req,res)=>{
    var datosOut = {
      "subject": req.body.subject,
      "to": req.body.to,
      "messageId": req.body.messageId,
      "date": req.body.date,
      "cc": req.body.cc,
      "references" : req.body.references,
      "modo" : req.body.modo,
      "id" : req.body.id,
      "usuario" : req.body.usuario,
      "folioemail" : req.body.folioemail
    }
    //enviar variables globales con la informacion como: codificacion,
    var codificacion = await inicioModelo.codificaciones();
    var emailsmtp = obtenerArchivosEmailYSuContenido(tipo='smtp')
    res.render('responderA.ejs',{ datosOut , codificacion, emailsmtp  })
  },
  newEmail : async (req,res)=>{
    var datosOut = {
      subject: req.body.subject,
      to: req.body.to,
      messageId: req.body.messageId,
      date: req.body.date,
      cc: req.body.cc,
      references : req.body.references,
      modo : req.body.modo,
      id : req.body.id,
      usuario : req.body.usuario
    }
    //enviar variables globales con la informacion como: codificacion,
    var codificacion = await inicioModelo.codificaciones();
    var emailsmtp = obtenerArchivosEmailYSuContenido(tipo='smtp')
    res.render('newEmail.ejs',{ datosOut , codificacion, emailsmtp })
  },
  enviar : async (req,res)=>{
    let archivo = fs.readFileSync(`./config/${req.body.from.split('@')[0]}.smtp.txt`, 'utf-8');
    var infoMail = archivo.replaceAll(/\r/g,'').split('\n');
    let usernameFile,passwordFile;
    for(var x=0; x<infoMail.length; x++){
      switch(infoMail[x].split('=')[0].toString('utf-8')){
        case 'username': usernameFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
        case 'password': passwordFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
      }
    }
    var transporter = nodemailer.createTransport({
      name : "telcel.com",
      host: "smtp.telcel.com",
      port: 25,
      secure: false,
      ignoreTLS : true,
      mailparser: true,
      auth: {
        type: "OAuth2",
        user: usernameFile,
        pass: passwordFile
      },
    });

    var bodyMail = `<!DOCTYPE html>
    <html lang="es">
    <head>
       <meta charset="UTF-8">
       <meta http-equiv="X-UA-Compatible" content="IE=edge">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>respuesta 555</title>
    </head>
    <body>
      <div style="text-aling: left; text-aling:justify;">
        <p>Folio: E${req.body.id}</p></br>
        <p style="font-size:1rem; color:#164968;" >${req.body.respuesta}</p>
      </div>
      <br>
      <div width="320" height="160">
        <p style="color:#7a7a7a;" >Con Blue Board y UNETE, Telcel te proporciona información comercial y capacitación en línea para que siempre estés actualizado. Si aún no tienes tu acceso, solicítalo al área de Capacitación Comercial.</p>
        <p style="color:#7a7a7a;" >Con MI TELCEL DISTRIBUIDORES puedes darle a tu cliente una atención inmediata en trámites de líneas Prepago y Pospago. Si aún no tienes tu acceso, solicítalo a un Analista de Desarrollo a Distribuidores.</p>
        <br>
        <div>
          <img src="cid:uniq-globotelcel.png" alt="globotelcel.png"  width="220" height="89"  /><br>
          <b style="color:#3148a2;">${req.body.nombrecompleto}</b><br>
          <b style="color:#3148a2;" >Asesor atención a distribuidores *555</b><br>
          <u style="color:#3148a2;">${req.body.from}</u><br>
          <strong><i style="color:#3148a2;" >Tel.&nbsp;</i></strong> *555 (opcion:1)<br>
          <small><i style="color:#3148a2;" >Horarios:&nbsp;</i></small>08:00:00-20:00:00<br>
        </div>
      </div>
      <br>
      <div style="border: none; border-top:1px #ccccc solid;">
        <div styel="text-decoration:none;"><b>De: &nbsp;</b>${req.body.to}<div/>
        <div><b>Enviado el: &nbsp; </b>${req.body.date}<div/>
        <div styel="text-decoration:none;" ><b>Para: &nbsp;</b>${req.body.from}<div/>
        <div><b>Asunto: &nbsp;</b>${req.body.subject}<div/>
      <div/>
      <br>
    </body>
    </html>`;
    var attachmentBody = JSON.parse(req.body.filesend);
    var attach = {
      filename: `globotelcel.png`,
      path: `http://10.160.36.204:3005/images/globotelcel.png`,
      cid: `uniq-globotelcel.png`
    }
    attachmentBody.push(attach);
    var htmlOld = req.body.html.replaceAll(/\\n|\\t|\\r/g,'');

    let message = {
      from: req.body.from,
      to: req.body.to,
      cc: req.body.cc,
      subject: req.body.subject,
      text: req.body.respuesta,
      priority: req.body.priority,
      replyTo : req.body.to,
      inreplyto : req.body.inreplyto,
      references: req.body.references,
      alternatives : [
        {
          contentType : 'text/html; charset=utf-8; method=REPLY',
          content: bodyMail + htmlOld
        }
      ],
      attachments: attachmentBody ,
      attachDataUrls : true,
      envelope: {
        from: req.body.from,
        to: req.body.to,
        cc : req.body.cc
      }
    }
    transporter.sendMail(message, async (err, info) => {
      if (err) {
        res.json({"respuesta": err, "envio": 0})
        console.log('error', err);
      } else {
        console.log('Message send - ', info)
        res.json({"respuesta": info, "envio" : 1});
      }
    })
    transporter.close();
  },
  updateMailResponsed : async (req,res)=>{
    //validar si existe attachment
    var attach="0";
    var rutaFileSend = `./filesend/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}/${req.body.folioemail}/`;
    if(JSON.parse(req.body.filesend).length > 0){
      var getFiles = JSON.parse(req.body.filesend); 
      try {
        //trata de hacer la carpeta si no hay
        fs.mkdirSync(rutaFileSend,(error)=>{
          if(error){
            console.log(error)
          }
        });
      } catch (error) {
        // existe carpeta sigue su cirso
      }
      
      for(var e=0; e<getFiles.length; e++){
        //escribir en la ruta el archivo: 
        var buffer = Buffer.from(getFiles[e].href.split(',')[1], 'base64');
        var rutaFileName = `${rutaFileSend}${getFiles[e].filename}`
        fs.writeFileSync(rutaFileName,buffer,'utf-8',(err)=>{
          if(err){
            console.log("el error es",err)
          }
        })  
      }

      var datosIn = {
        "id": req.body.id,
        "ex": req.body.ex,
        "fuerzadeventas": req.body.fuerzadeventas,
        "estado": req.body.estado,
        "codificacion": req.body.codificacion,
        "respuesta" : req.body.respuesta,
        "filesend" :  rutaFileSend, //leer el contenido de la ruta
        "nombrecompleto" : req.body.nombrecompleto
      }

      var resultado = await inicioModelo.updateMailResponsed(datosIn);
      if(typeof resultado !== "undefined"){
        res.json({"respuesta" : 1 })
      } else {
        res.json({"respuesta": 0})
      }
    } else {
      var datosIn = {
        "id": req.body.id,
        "ex": req.body.ex,
        "fuerzadeventas": req.body.fuerzadeventas,
        "estado": req.body.estado,
        "codificacion": req.body.codificacion,
        "respuesta" : req.body.respuesta,
        "filesend" :"",
        "nombrecompleto" : req.body.nombrecompleto
      }
      var resultado = await inicioModelo.updateMailResponsed(datosIn);
      if(typeof resultado !== "undefined"){
        res.json({"respuesta" : 1 })
      } else {
        res.json({"respuesta": 0})
      }
    }    
  },
  enviarNuevoCorreo : async (req,res)=>{
    let archivo = fs.readFileSync(`./config/${req.body.from.split('@')[0]}.smtp.txt`, 'utf-8');
    var infoMail = archivo.replaceAll(/\r/g,'').split('\n');
    let usernameFile,passwordFile;
    for(var x=0; x<infoMail.length; x++){
      switch(infoMail[x].split('=')[0].toString('utf-8')){
        case 'username': usernameFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
        case 'password': passwordFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
      }
    }
    console.log(usernameFile,passwordFile)

    var transporter = nodemailer.createTransport({
      name : "telcel.com",
      host: "smtp.telcel.com",
      port: 25,
      secure: false,
      ignoreTLS : true,
      mailparser: true,
      auth: {
        type: "OAuth2",
        user: usernameFile,
        pass: passwordFile
      },
    });

    var bodyMail = `<!DOCTYPE html>
    <html lang="es">
    <head>
       <meta charset="UTF-8">
       <meta http-equiv="X-UA-Compatible" content="IE=edge">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>respuesta 555</title>
    </head>
    <body>
      <div style="text-aling: left; text-aling:justify;">
        <p>Folio: N${req.body.idinsertado}</p></br>
        <p style="font-size:1rem; color:#164968;" >${req.body.msg}</p>
      </div>
      <br>
      <div width="320" height="160">
        <p style="color:#7a7a7a;" >Con Blue Board y UNETE, Telcel te proporciona información comercial y capacitación en línea para que siempre estés actualizado. Si aún no tienes tu acceso, solicítalo al área de Capacitación Comercial.</p>
        <p style="color:#7a7a7a;" >Con MI TELCEL DISTRIBUIDORES puedes darle a tu cliente una atención inmediata en trámites de líneas Prepago y Pospago. Si aún no tienes tu acceso, solicítalo a un Analista de Desarrollo a Distribuidores.</p>
        <br>
        <div>
          <img src="cid:uniq-globotelcel.png" alt="globotelcel.png"  width="220" height="89"  /><br>
          <b style="color:#3148a2;">${req.body.nombrecompleto}</b><br>
          <b style="color:#3148a2;" >Asesor atención a distribuidores *555</b><br>
          <u style="color:#3148a2;">${req.body.from}</u><br>
          <strong><i style="color:#3148a2;" >Tel.&nbsp;</i></strong> *555 (opcion:1)<br>
          <small><i style="color:#3148a2;" >Horarios:&nbsp;</i></small>08:00:00-20:00:00<br>
        </div>
      </div>
      <br>
    </body>
    </html>`;
    var attachmentBody = JSON.parse(req.body.attach);
    var attach = {
      filename: `globotelcel.png`,
      path: `http://10.160.36.204:3005/images/globotelcel.png`,
      cid: `uniq-globotelcel.png`
    }
    attachmentBody.push(attach);

    let message = {
      from: req.body.from,
      to: req.body.to,
      subject: req.body.subject,
      text: req.body.msg,
      priority: req.body.priority,
      cc: req.body.cc,
      alternatives : [
        {
          contentType : 'text/html; charset=utf-8; method=REPLY',
          content: bodyMail
        }
      ],
      attachments: attachmentBody ,
      attachDataUrls : true,
      envelope: {
        from: req.body.from,
        to: req.body.to,
        cc : req.body.cc
      }
    }
    transporter.sendMail(message, async (err, info) => {
      if (err) {
        res.json({"respuesta": err, "envio": 0})
        console.log('error', err);
      } else {
        console.log('Message send - ', info)
        res.json({"respuesta": info, "envio" : 1});
      }
    })
    transporter.close();
  },
  saveEmailSend : async (req,res)=>{
    //validar si existe attachment
    if(JSON.parse(req.body.attach).length > 0){
      //guardar archivos que llegen:
      var archivosentrantes = JSON.parse(req.body.attach)
      //recorrer los archivos e insertarlos en la carpeta:
      for(var i=0; i<archivosentrantes.length; i++){

        var folderName = req.body.to.replaceAll('.','');
        var ruta = `./newmailfilesend/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}/${folderName}/`;
        //validar si existe sino crealo
        try {
          fs.mkdirSync(ruta, (err)=>{
            if(err){
              console.log(err)
            }
          })
        } catch (error) {
        } 
        var filebuffer =  Buffer.from(archivosentrantes[i].href.split(',')[1], 'base64');
        fs.writeFileSync(`${ruta}${archivosentrantes[i].filename}`,filebuffer,'utf-8',(err)=>{
          if(err){
            console.log(err);
          }
        })
      }
      let message = {
        "from": req.body.from,
        "to": req.body.to,
        "subject": req.body.subject,
        "msg": req.body.msg,
        "priority": req.body.priority,
        "cc": req.body.cc,
        "attach": ruta ,
        "nombrecompleto": req.body.nombrecompleto,
        "usuario": req.body.usuario
      }

      var respuesta = await inicioModelo.saveEmailSend(message);
      if(respuesta > 0 ){
        res.status('200').json({ "respuesta" : respuesta })
      } else {
        res.status('200').json({ "respuesta" : 0 })
      }
    } else {
      let message = {
        "from": req.body.from,
        "to": req.body.to,
        "subject": req.body.subject,
        "msg": req.body.msg,
        "priority": req.body.priority,
        "cc": req.body.cc,
        "attach": "" ,
        "nombrecompleto": req.body.nombrecompleto,
        "usuario": req.body.usuario
      }
      var respuesta = await inicioModelo.saveEmailSend(message);
      if(respuesta > 0 ){
        res.status('200').json({ "respuesta" : respuesta })
      } else {
        res.status('200').json({ "respuesta" : 0 })
      }
    }
  },
  configurar : (req,res)=>{
    if( typeof req.session.id_personal === 'undefined' ) {
      res.redirect('/');
    } else {
      res.render('configuracion',{ 
        "title": "configuracion",
        "usuario" : req.session.usuario,
        "nombrecompleto":  req.session.nombre_completo 
      })
	  }
  },
  getMailTxt : async (req,res) => {
    var filemail = fs.readdirSync('./config/','utf-8')
    let popmail = [];
    let smtpmail = [];
    if(filemail.length > 0){
      filemail.forEach( item => {
        if(item.indexOf('pop') > -1){
          popmail.push(item)
        }
        if(item.indexOf('smtp') > -1){
          smtpmail.push(item)
        }
      })
    }
    res.render('mailTableTxt.ejs',{ "pop": popmail, "smtp": smtpmail })
  },
  getTimeToWork : async (req,res)=>{
    var horarioDeServicio = [];
    var horario = fs.readFileSync(`./config/${req.body.archivo}`,'utf-8');
    var timeServices = horario.replaceAll(/\t|\r/g,'').split('\n');
    timeServices.forEach( item =>{
      horarioDeServicio.push( item.replaceAll('time=','').trim() )
    })
    res.render('horario.ejs',{ "horario" : horarioDeServicio })
  },
  getBlackList : async (req,res)=>{
    let emailBlock = "";
    let emailBlackList = fs.readFileSync(`./config/${req.body.archivo}`,'utf-8');
    let wrongMails = emailBlackList.replaceAll(/\t|\r/g,'').split('\n');
    wrongMails.forEach( item =>{
      emailBlock += item.replaceAll('email=','').trim()+"\n";
    })
    res.render('blacklist.ejs',{ "blacklist" : emailBlock })
  },
  listaNegraUpdate : async (req,res)=>{
    let data = req.body.listanegra;
    fs.writeFile(`./config/${req.body.archivo}`, data, (err) => {
      if (err){
        console.log(err);
        res.status('200').json({"respuesta": 0 });
      } else {
        res.status('200').json({"respuesta": 1 });
      }
    });
  },
  updateTimeToWork : async (req,res)=>{
    let data = req.body.datos;
    fs.writeFile(`./config/${req.body.archivo}`, data, (err) => {
      if (err){
        console.log(err);
        res.status('200').json({"respuesta": 0 });
      } else {
        //console.log(fs.readFileSync(`./config/${req.body.archivo}`, "utf8"));
        res.status('200').json({"respuesta": 1 });
      }
    });
  },
  editMailActive : async(req,res)=>{
    let archivo = fs.readFileSync(`./config/${req.body.archivo}`, 'utf-8');
    var infoMail = archivo.replaceAll(/\r/g,'').split('\n');
    let usernameFile,passwordFile;
    for(var x=0; x<infoMail.length; x++){
      switch(infoMail[x].split('=')[0].toString('utf-8')){
        case 'username': usernameFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
        case 'password': passwordFile =`${infoMail[x].split('=')[1].toString('utf-8')}` ; break
      }
    }
    console.log(usernameFile,passwordFile)
    res.render('emailEditContent.ejs',{ usernameFile, passwordFile, "titleFile": req.body.archivo, "fileUpdate": req.body.archivo ,"esDeLectura": "readonly"})
  },
  newEmailFile : async (req,res)=>{
    let usernameFile="";
    let passwordFile="";
    res.render('emailEditContent.ejs',{ usernameFile, passwordFile, "fileUpdate": ""  ,"titleFile": "Make a new email file", "esDeLectura" : "" })
  },
  saveOrUpdateFile  : async (req,res)=>{
    let data = req.body.datos;
    fs.writeFile(`./config/${req.body.archivo}`, data, (err) => {
      if (err){
        console.log(err);
        res.status('200').json({"respuesta": 0 });
      } else {
        res.status('200').json({"respuesta": 1 });
      }
    });
  },
  //MIS FUNCIONES
  addStaff: async(req, res) => {
    res.render('./vistasPreliminares/modales/addStaff.ejs');
  },
  saveStaff: async(req, res) => {

    let staffData = {

      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      email:req.body.email,
      firma: req.body.firma,
      depto:req.body.depto,
      usuario: req.body.usuario,
      contrasenia: sha256(req.body.contrasenia), //encryptar la contraeña a sha-256 para la base 
      privilegio: req.body.privilegio,
      fechaAlta: moment().format('YYYY-MM-DD HH:mm:ss')
    }
    

    //insert to db
    var respuesta = await inicioModelo.saveStaff(staffData);

    if(respuesta > 0) {

      res.json({ respuesta: respuesta });
    }
    else {
      res.json({ respuesta: 0 });
    }

  },
  reportesMail : async (req,res)=>{
    if( typeof req.session.id_personal === 'undefined' ) {
      res.redirect('/');
    } else {
      res.render('reportes.ejs',{
        "title": "reportes 555",
        "usuario" : req.session.usuario,
        "nombrecompleto":  req.session.nombre_completo 
      });
	  }
    
  },
  deployReportOptions: async(req, res) => {

    res.render('./vistasPreliminares/tablas/fechas.ejs')

  },
  getExcel: async(req, res) => {

    //fi: fecha inicia; ff: fecha final
    datosIn = {
      fi: req.body.fiMS,
      ff: req.body.ffMS,
      estado: req.body.estado,
      // personal: req.body.personal,
      // codificacion: req.body.codificacion
      
    }

    console.log('EXCEL', datosIn);
  
    //consultar a la base
    var resultados = await inicioModelo.getExcel(datosIn);

    //procesar algunos datos para mostrarlos correctamente
    
    resultados.forEach( elemento => {
      

      elemento.fechaderespuesta = toDate(elemento.fechaderespuesta) +' '+ toHours(elemento.fechaderespuesta);


    });

    res.render('/vistasPreliminares/tablas/tablaReportes.ejs', { resultados }) // solo mostramos el cuadro de fechas pra posteriormente listar en la tabla

    console.log(resultados);
  }
}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

function obtenerArchivosEmailYSuContenido(tipo){

  //carga los correos que van a servir:
  var getTxtEmail = fs.readdirSync('./config/','utf-8');
  let emailActivos = [];
  if(getTxtEmail.length > 0){
    getTxtEmail.forEach( item=>{
      if(item.indexOf(tipo) > -1){
        emailActivos.push(item);
      }
    })
    let contentArray = [];
    for( var x=0; x<emailActivos.length; x++ ){
      let archivo_ = fs.readFileSync(`./config/${emailActivos[x]}`, 'utf-8');
      var infoMail = archivo_.replaceAll(/\r/g,'').split('\n');
      
      var myRow = {
        "archivo" : emailActivos[x],
        "email": "",
        "pass" : ""
      }

      for(var i=0; i<infoMail.length; i++){

        switch(infoMail[i].split('=')[0].toString('utf-8')){
          case 'username': 
            myRow.email = infoMail[i].split('=')[1].toString('utf-8');
            break;
          case 'password': 
            myRow.pass = infoMail[i].split('=')[1].toString('utf-8');
            break;
        }
      }
      contentArray.push(myRow);
    }
    return contentArray;
  }
}
