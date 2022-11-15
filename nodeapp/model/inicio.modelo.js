const db23 = require('../db/base96.js');

module.exports = {
   codificaciones : async () => {
      var sql = `SELECT id,codificacion FROM correos555.codificacion WHERE estado in ('activo');`;
     return await db23.select(sql);
   },
   saveNewEmal : async (datosIn)=>{
      try {
         var sql=`INSERT INTO correos555.emails (
         folioemail,
         rutaFile,
         asunto,
         findEmail,
         recibe,
         messageid,
         receivedDate,
         ex,
         fuerzadeventas,
         estado,
         codificacion,
         fechaActualizacion,
         respuesta,
         filesend)
         VALUES(
         '${datosIn.folioemail}',
         '${datosIn.rutaFile}',
         '${datosIn.asunto}',
         '${datosIn.findEmail}',
         '${datosIn.recibe}',
         '${datosIn.messageid}',
         '${datosIn.receiveDate}',
         '${datosIn.ex}',
         '${datosIn.fuerzadeventas}',
         '${datosIn.estado}',
         '${datosIn.codificacion}',
         '${datosIn.fechaActualizacion}',
         '${datosIn.respuesta}',
         '${datosIn.filesend}'
         );`
         return await db23.lastIdInsert(sql);
      } catch (error) {
         console.log(error)
      }
   },
   guardarCorreo : async (datosIn) =>{
      try {
         var sql=`INSERT INTO correos555.correo (html, text_, headers, from_, subject, messageId, inReplyTo, priority, to_, cc, date_, receivedDate, attachments, contentType, user , fuerzadeventa , estado, codificacion, fechaderespuesta,findEmail,attach) 
         VALUES(
            '${datosIn.html}', 
            '${datosIn.text}', 
            '${datosIn.headers}',
            '${datosIn.from}', 
            '${datosIn.subject}', 
            '${datosIn.messageId}', 
            '${datosIn.inReplyTo}', 
            '${datosIn.priority}', 
            '${datosIn.to}', 
            '${datosIn.cc}', 
            '${datosIn.date}', 
            '${datosIn.receivedDate}', 
            '${datosIn.attachments}',
            '${datosIn.contentType}',
            '${datosIn.user}',
            '${datosIn.fuerzadeventa}',
            '${datosIn.estado}',
            '${datosIn.codificacion}',
            '${datosIn.fechaderespuesta}',
            '${datosIn.findEmail}',
            '${datosIn.attach}'
            );`;
        return await db23.update(sql);
      } catch (err) {
         return [];
      }
   },
   getAllMailDataBase : async (datosIn)=>{
      try{
         switch(datosIn.estado.toLowerCase() ){
            case 'close':
               var sql=`SELECT id,folioemail,rutaFile,asunto,findEmail,recibe,messageid,receivedDate,ex,fuerzadeventas,estado,codificacion,
               fechaActualizacion,respuesta,filesend FROM correos555.emails WHERE estado = '${datosIn.estado}' order by receivedDate desc ${datosIn.limit};`;
               break;
            default:
               var sql=`SELECT id,folioemail,rutaFile,asunto,findEmail,recibe,messageid,receivedDate,ex,fuerzadeventas,estado,codificacion,
               fechaActualizacion,respuesta,filesend FROM correos555.emails where estado in ('new','atendiendo') order by receivedDate desc ${datosIn.limit};`;
               break;
         }
         return await db23.select(sql);
      }catch(err){
         console.log(err);
         return 0
      }
   },
   getRespuestaEnviada : async (datosIn)=>{
      try{
         var sql=`SELECT * FROM correos555.emails where  id in (${datosIn.id}) order by receivedDate desc; `;
         return await db23.select(sql);
      }catch(err){
         console.log(err)
         return
      }
   },
   findEmailByIdAndSubject : async (datosIn)=>{
      try{
         if(isNaN(datosIn.entrada)){
            var sql=`SELECT * FROM correos555.emails where asunto like '%${datosIn.entrada}%' or findEmail like '%${datosIn.entrada}%' order by receivedDate desc; `;
         }else{
            var sql=`SELECT * FROM correos555.emails where  id in (${datosIn.entrada}) order by receivedDate desc; `;
         }    
         return await db23.select(sql);
      }catch(err){
         return 0
      }
   },
   getUniqueMessageId : async (datosIn)=>{
      try {
         var sql=`SELECT id, messageid, receivedDate,asunto FROM correos555.emails WHERE 
         asunto='${datosIn.subject}' and 
         findEmail='${datosIn.findEmail}' and 
         receivedDate = '${datosIn.receivedDate}' ;`;
         return await db23.select(sql);
      } catch (error) {
         console.log(error)
         return error;
      }
   },
   getMailDataBaseByMessageId : async (datosIn)=>{
      try {
         var sql=`SELECT * FROM correos555.correo WHERE id = ${datosIn.id} `;
         return await db23.select(sql);
      } catch (error) {
         console.log(error)
         return [];
      }
   },
   getLastMailDb : async ()=>{
      try {
         var sql=`SELECT id,receivedDate,messageId FROM correos555.correo order by receivedDate desc limit 1; `;
         return await db23.select(sql);
      } catch (error) {
         console.log(error)
      }
      
   },
   updateMailResponsed : async (datosIn)=>{ //
      var sql =`UPDATE correos555.emails SET 
      ex='${datosIn.ex}', 
      fuerzadeventas='${datosIn.fuerzadeventas}', 
      estado='${datosIn.estado}', 
      codificacion='${datosIn.codificacion}', 
      fechaActualizacion='${new Date().getTime()}', 
      respuesta='${datosIn.respuesta}',
      filesend='${datosIn.filesend}'
      WHERE id=${datosIn.id};`;
      return await db23.update(sql);

      /** "id": req.body.id,
        "ex": req.body.ex,
        "fuerzadeventas": req.body.fuerzadeventas,
        "estado": req.body.estado,
        "codificacion": req.body.codificacion,
        "respuesta" : req.body.respuesta,
        "filesend" :"",
        "nombrecompleto" : req.body.nombrecompleto */
   },
   saveStaff: async(staffData) => {
      var sql = `INSERT INTO correos555.personal (nombres, apellidos, email, foto, firma, depto, usuario, contrasenia, privilegio, fechaAlta) VALUES ( '${staffData.nombres}', '${staffData.apellidos}', '${staffData.email}', '0','${staffData.firma}','${staffData.depto}', '${staffData.usuario}', '${staffData.contrasenia}', '${staffData.privilegio}', '${staffData.fechaAlta}' );`;
      return await db23.update(sql);
   },
   saveEmailSend : async(datosIn)=>{
      try {
         var sql=`INSERT INTO correos555.salientes (from_, to_, subject_, msg, priority, cc, attach, nombrecompleto, usuario, fechadeenvio) 
         VALUES(
            '${datosIn.from}', 
            '${datosIn.to}', 
            '${datosIn.subject}', 
            '${datosIn.msg}', 
            '${datosIn.priority}', 
            '${datosIn.cc}', 
            '${datosIn.attach}', 
            '${datosIn.nombrecompleto}', 
            '${datosIn.usuario}', 
            '${new Date().getTime()}'
            ); `;
         return await db23.lastIdInsert(sql);
      } catch (error) {
         console.log(error)
         return 0
      }
   },
   borrarId : async (datosIn)=>{
      try {
         var sql =`DELETE FROM correos555.emails WHERE id=${datosIn.id}`;
         return await db23.update(sql);
      } catch (error) {
         return error
      }
   }
}