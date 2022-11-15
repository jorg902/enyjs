let tiempoderecarga=0;
let tiempoCargaBase=0;
let estado="new";
//arranca los servicios de bandeja pop:
document.addEventListener('DOMContentLoaded',(e)=>{
	e.preventDefault();
	setTimeout(`inBox()`,30000);
})

//revisa que archivos pop existen para la bandeja.
function inBox() {
	var correos = JSON.parse( document.querySelector('#correoUno').value);
	if(correos.length > 0){
		correos.forEach(function (el, index) {
			setTimeout(function () {
				revisarBandejaDeEntrada(el)
			}, index * 10000);
		});
	}else {
		return alert(`No exite archivo configurado, nombrecorreo.pop.txt`)
	}
}

//consulta y guarda correos en base de datos.
function revisarBandejaDeEntrada(emailFile){
	$.ajax({
		url: "/inbox",
		type: "post",
		data : { "archivo" : emailFile },
		beforeSend: function () {
			clearTimeout(tiempoderecarga)
		},
		success: function (res) {
			console.clear();
			console.log("res.message:",res.message)
			//proceso de cargas para la bandeja
			switch(res.message){
				case 'is not time':
					tiempoderecarga = setTimeout(`inBox()`,60*1000);
					break;
				case 'save':
				case 'no save':
				case 'delete':
					tiempoderecarga = setTimeout(`revisarBandejaDeEntrada('${emailFile}')`,19000)
					break;
				case 'Not found':
						alert("bajo el correo archivo no creado")
					break;
				case 'Error: No such message':
					tiempoderecarga = setTimeout(`inBox()`, 1000*60);
					break;
				case 'out time':
					break;
				case '/salir':
					alert("cierra sesion preciona F5")
					window.location.href=res.message;
					break;
			}
		}
	})
}

//se cambia el fondo de boton, se va a buscar a base de datos y ejecuta inbox
function btnLoadActive(){ //is-selected
	document.querySelector('#btn-reload').removeAttribute('class');
	document.querySelector('#btn-reload').setAttribute('class','button is-success is-selected')

	//setear botones
	document.querySelector('#btn-close').removeAttribute('class');
	document.querySelector('#btn-close').setAttribute('class','button is-danger is-outlined');
	// new
	estado = "new";
	$.ajax({
		url : '/getMailDb',
		type : "post",
		data : { estado, "limit" : "limit 0,11"},
		beforeSend : function(){
			clearTimeout(tiempoCargaBase)
		},
		success : function(res){
			var perPage = 10; //input lateral para indicar cuantos se muestran
			var lista = res.listaMensajes;
			listRender(lista,perPage);
			//validar si se activan los botones de antes y despues:
         if( lista.length > perPage ){
            document.querySelector('#after-btn').disabled=false;
         } else{
				document.querySelector('#now-btn').innerHTML = 1;
				document.querySelector('#before-btn').disabled=true;
				document.querySelector('#after-btn').disabled=true;
			}
			console.log("cargara nuevamente en 60 seg")
			tiempoCargaBase = setTimeout(`checkPage()`,60000);
		}
	})
}

//realiza la busaueda de pagina mediante un apuntador, consulta de 20
function checkPage(pag = 0 ){    
	var perPage = 10; //input lateral para indicar cuantos se muestran
	if(pag === 0 ){
		pag = parseInt(document.querySelector('#now-btn').innerHTML);
	}
	switch(pag){
		case 1: 
			var startLimit = pag * 0;
			var limit =`limit ${startLimit},${perPage}`;
			$.ajax({
				url : "/getMailDb",
				type : "post",
				data : {	estado, "limit": limit },
				beforeSend : function(){
					clearTimeout(tiempoCargaBase)
				},
				success : function(res){
					document.querySelector('#now-btn').innerHTML = pag;
					var lista = res.listaMensajes;
					if(lista.length > 0){
						document.querySelector('#now-btn').innerHTML = pag;
						listRender(lista,perPage);
						tiempoCargaBase = setTimeout(`checkPage()`,30000)
					} else {
						console.log("no hay mensajes")
					}
				}
			})
			break;
		default:
			var startLimit = (pag-1) * perPage;
			var limit =`limit ${startLimit},${perPage}`;
			$.ajax({
				url : "/getMailDb",
				type : "post",
				data : {	estado, "limit": limit },
				beforeSend : function(){
					clearTimeout(tiempoCargaBase)
				},
				success : function(res){
					var lista = res.listaMensajes;
					if(lista.length > 0){
						document.querySelector('#now-btn').innerHTML = pag;
						listRender(lista,perPage);
						tiempoCargaBase = setTimeout(`checkPage()`,30000)
					} else{
						console.log("no hay mensajes")
					}
				}
			})
			break;
	}
}

//active button using class
function btnClosedActive(){ //is-selected
	document.querySelector('#btn-close').removeAttribute('class');
	document.querySelector('#btn-close').setAttribute('class','button is-success is-selected')

	//setear botones
	document.querySelector('#btn-reload').removeAttribute('class');
	document.querySelector('#btn-reload').setAttribute('class','button is-primary is-outlined');
	//close
	estado = "close";
	$.ajax({
		url : '/getMailDb',
		type : "post",
		data : { estado ,"limit" : "limit 0,11" },
		beforeSend : function(){
			clearTimeout(tiempoCargaBase)
			document.querySelector('#barraProgresiva').style.display="block";
		},
		success : function(res){
			var perPage = 10; //input lateral para indicar cuantos se muestran
			var lista = res.listaMensajes;
			listRender(lista,perPage);
			//validar si se activan los botones de antes y despues:
         if( lista.length > perPage ){
            document.querySelector('#after-btn').disabled=false;
         } else{
				document.querySelector('#before-btn').disabled=true;
				document.querySelector('#after-btn').disabled=true;
			}
		}
	})
}

//muestra correo lateral usando paginacion:
function listRender(lista,perPage){
	var template = document.querySelector('#dbemail').innerHTML;
	var rendered ="";
	//validar si se activa el boton de siguiente
	if(lista.length>0){
		//debe indicar cual es su punto de paro el maximo de la pagina o el que tiene en base
		if(lista.length < perPage){
			perPage = lista.length;
		}
		for(var i=0; i<perPage; i++){
			rendered +=  Mustache.render(template,{
				"id" : lista[i].id,
				"asunto" : lista[i].asunto.replaceAll(/\n|\r|\t|\\n|\\t|\\r/g,''),
				"subject" : lista[i].asunto.replaceAll(/\n|\r|\t|\\n|\\t|\\r/g,'').substring(0,30),
				"folioemail" : lista[i].folioemail,
				"rutaFile": lista[i].rutaFile,
				"from" : lista[i].findEmail,
				"from_" : lista[i].findEmail.substring(0,30),
				"to": lista[i].recibe,
				"receivedDate" : lista[i].receivedDate,
				"messageid" : lista[i].messageid,
				"estado" :  lista[i].estado
			})
		}
		document.querySelector('#listMenu').innerHTML = rendered;
		document.querySelector('#barraProgresiva').style.display="none";
	}
}

//estamos en una pagina mayor a la primera, regresamos...
function clickBefore(){
	clearTimeout(tiempoCargaBase);
	var pag = document.querySelector('#now-btn').innerHTML;
	var siguiente = parseInt(pag) - 1;
	if(parseInt(siguiente) == 1){ document.querySelector('#before-btn').disabled=true; }
	checkPage(siguiente);
}

//hay mas paginas, vamos a la siguiente
function clickNext(){
	clearTimeout(tiempoCargaBase);
	var pag = document.querySelector('#now-btn').innerHTML;
	var siguiente = parseInt(pag) + 1;
	if(parseInt(siguiente) > 1){ document.querySelector('#before-btn').disabled=false; }
	//rango a buscar:
	checkPage(siguiente);
}

//muestra el email selecionado
function openMail(folioemail,rutaFile,id,asunto,from_,recibe,messageid,fechaQueLlego,estado){
	var ruta = rutaFile+folioemail
	console.log("llego aqui, esta bien los datos enviados")
	//con el folio se busca el archivo cual usar? attach o eml
	$.ajax({
		url : "/getFileEmail",
		type: "post",
		data : { ruta, id },
		beforeSend : function(){
			console.log("cargando... la vista de correo")
		}, 
		success : function(res){ //attach
			var links ="";
			if(res.error === 0 ){

				//revisar si existe attachment que 
				if(true === Array.isArray(res.attach)){
					res.attach.forEach( item =>{
						var filebase64 = _arrayBufferToBase64( item.content.data )
						links += showFileAdd(item.contentType,filebase64[1],item.filename,item.filename);
						
					})
				}
				
				var displayBtn1="block";
				var displayBtn2 ="none";
				if(estado === "close"){
					displayBtn1="none";
					displayBtn2 ="block";
				}
				var template = document.querySelector('#emailBody').innerHTML;
				var rendered = Mustache.render(template, { 
					"id": id , 
					"folioemail" : folioemail,
					"messageId": messageid, 
					"subject": asunto, 
					"src": './images/profile.png', 
					"from": from_, 
					"to": recibe, 
					"date": fechaQueLlego, 
					"references": messageid,
					"cc": "", 
					"html": res.html,
					"displayBtn1" : displayBtn1,
					"displayBtn2" : displayBtn2,
					"attach" : links
				});

			} else {
				var template = document.querySelector('#mimefile').innerHTML;
				rendered = Mustache.render(template,{
					"mimefile" :  res.html
				}) 
			}
			
			document.querySelector('#cuerpoDeCorreo').innerHTML=`${rendered}`
		}
	})
}

//funcion de borrado:
function borrarEmailDuplicado(id){
	var confirmacion = confirm('Estas borrar lo de base?','');
	if(confirmacion === null){
		return
	}
	$.ajax({
		url : "/borrarId",
		type : "post",
		data :{id},
		beforeSend :  function(){

		},
		success : function(res){
			if(res.message == "delete"){
				clearTimeout(tiempoCargaBase);
				checkPage(parseInt(document.querySelector('#now-btn').innerHTML));
				alert("se elimino elemento!")
			}
		}
	})
}

function _arrayBufferToBase64( bufferIn ) {
	var binary = new Uint8Array(bufferIn);
	var convertidoString = window.btoa(	binary.reduce((data, byte) => data + String.fromCharCode(byte), ''));
	var convertidoStringSinfin = convertidoString.trim().replaceAll(/=| /g,'');
	return [convertidoString, convertidoStringSinfin];
}

//agrega los contenttype en links y devuelve un link con base64 href:
function showFileAdd( contentType,contenido,fileName,generatedFileName ){
	var listaAdjuntos = ``;
	var tmplAttch = document.querySelector('#attachId').innerHTML;
	switch (contentType.toLowerCase()) {
		case 'image/jpeg':
		case 'image/jpg':
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:image/jpg;base64,${contenido}`,
				"img" : "./images/Gallery.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break;
		case 'image/png':
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:image/png;base64,${contenido}`,
				"img" : "./images/Gallery.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
		  	break
		case 'application/pdf':
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:application/pdf;base64,${contenido}`,
				"img" : "./images/pdf.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break
		case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':  //excel
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${contenido }`,
				"img" : "./images/excel.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break
		case 'application/vnd.ms-excel':
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:application/vnd.ms-excel;base64,${contenido}`,
				"img" : "./images/excel.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break
		case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': //word
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${contenido}`,
				"img" : "./images/wordicon.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break
		case 'application/msword':
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : fileName,
				"contenido" : `data:application/msword;base64,${contenido}`,
				"img" : "./images/wordicon.png",
				"tag" : fileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break;
		case 'message/rfc822':
			listaAdjuntos = Mustache.render(tmplAttch,{
				"fileName" : generatedFileName,
				"contenido" : `data:message/rfc822;base64,${contenido}`,
				"img" : "./images/emailicon.png",
				"tag" : generatedFileName.substring(0,10).replaceAll(/ /g,'_')
			})
			break;
	}
	return listaAdjuntos;
}

//funcion muestra formulario responder a :
function modalResponderA(folioemail,id,subject,from,messageId,date,cc,to,references,modo){
	var usuario = document.querySelector('#usuario-name').innerHTML;
	if(modo == 1){ from = from+","+to;	}
	$.ajax({
		url : "/responderA",
		type: "put",
		data : { subject, 'to' : from,messageId,date,cc,references,modo, id , usuario, folioemail },
		beforeSend : function(){
			contentModal.innerHTML=	``;
		},
		success : function(res){
			modal.classList.add('is-active');
			contentModal.innerHTML = res;
			document.querySelector('#adjuntosMail').innerHTML=``;
		}
	})
}

//muestra archivos cargados para enviar:
function previewFile(){
	var file = document.querySelector('input[type=file]').files[0];
	var subject = document.querySelector('#nombretomadoparasubirarchivos').innerHTML
	//limpieza de nombre para los adjuntos:
	if(subject.indexOf(':') > -1){ subject = subject.replaceAll(/:| /g, '_') 	}
	const reader = new FileReader();
	var fileName = file.name;
	var contentType = file.type;
	var generatedFileName=`${subject + "_saliente"}.eml`;
	
	reader.addEventListener('load', () =>{
		//valores obtenidos: imagen : evt.target.result, filename: file.name, tipoexten : file.type
		var content = reader.result.split(',')[1];
		var addfile = showFileAdd( contentType,content,fileName,generatedFileName )
		document.querySelector('#adjuntosMail').innerHTML += addfile;
	});
	if(file){
		reader.readAsDataURL(file)
	}
}

//funcion muestra formulario responder a todos:
function getDataResponse(){
	var email_ =  document.querySelector('#email_').value;
	var messageId_ = document.querySelector('#messageId_').value;
	var date_ =  document.querySelector('#date_').value;
	var subject_= document.querySelector('#subject_').value;
	var usuario_ = document.querySelector('#usuario_').value;
	var to_ = document.querySelector('#to_').value;
	var cc_ = document.querySelector('#cc_').value;
	var estado_ = document.querySelector('#estado_').value;
	var fuerzaDeVenta_ = document.querySelector('#fuerzaDeVenta_').value;
	var codificacion_ = document.querySelector('#codificacion_').value;
	var msg_ = document.querySelector('#msg_').value;
	var html_div = document.querySelector('#bodyMailComplete').innerHTML;
	var references =  document.querySelector('#references').value;
	var modo = document.querySelector("#modo").value;
	var idcorreo = document.querySelector('#idcorreo').value;
	var nombrecompleto = document.querySelector('#nombrecompleto').value;
	var folioemail = document.querySelector('#folioemail').value;
	//validar si estan vacios.
	if( email_.length === 0  || usuario_.length === 0 || nombrecompleto.length === 0 ){
		return alert("Llene los campos obligatorios,*");
	}

	//validar si envia o no repsuesta:
	if(estado_ !== "notificacion"){
		if(msg_.length === 0 ){
			return alert("Escriba la respuesta del mensaje!");
		}
	}

	var adjuntosMail = document.querySelectorAll('#adjuntosMail div a'); 
	var attachArray = [];
	if(adjuntosMail.length > 0){
		for(var i=0; i<adjuntosMail.length; i++){
			var attach = {
				filename: `${adjuntosMail[i].download}`,
				href: `${adjuntosMail[i].href}`,
			}
			attachArray.push(attach);
		}
	}

	//validar que esten dividiso por comas:
	let message = {
      html: html_div,
      respuesta: msg_,
		date : date_,
      inreplyto : messageId_,
      from: email_,
      subject: subject_,
      priority: "normal",
      to: to_,
      cc: cc_,
		ex : usuario_,
		estado : estado_,
		fuerzadeventas : fuerzaDeVenta_,
		codificacion : codificacion_,
		references : references,
		modo : modo,
		id : idcorreo,
		filesend : JSON.stringify(attachArray),
		nombrecompleto : nombrecompleto,
		folioemail : folioemail
   }

	if(message.estado === "notificacion" || message.estado === "atendiendo"){
		updateMailResponsed(message.folioemail,message.id,message.ex,message.fuerzadeventas,message.estado,message.codificacion,message.respuesta,message.filesend);
	} else {
		$.ajax({
			url: "/sendMail",
			type : "post",
			data : message ,
			beforeSend : function(){
			},
			success : function(res){
				if( parseInt(res.envio) == 0){
					//hay error
					alert("existe un error al enviar:",JSON.stringify(res.respuesta))
				} else {					
					//actualiza la incidencia con us id:
					updateMailResponsed(message.folioemail,message.id,message.ex,message.fuerzadeventas,message.estado,message.codificacion,message.respuesta,message.filesend);
				}
			}
		});
	}
}

function updateMailResponsed(folioemail,id,ex,fuerzadeventas,estado,codificacion,respuesta,filesend){
	//ex,nombrecompleto,fuerzadeventas,estado,codificacion,fechaActualizacion,respuesta,filesend
	$.ajax({
		url: "/updateMailResponsed",
		type : "post",
		data : { folioemail,id,ex,fuerzadeventas,estado,codificacion,respuesta, filesend } ,
		success : function(res){
         console.log("aqui dice si actualizo el correo",res)
			if(estado === "notificacion" || estado === "atendiedo"){
				alert(`se cambio el estado del correo a: ${estado}`)
			} else {
				alert(`Se cerro el correo y se envio respuesta`)
			}
			modal.classList.remove('is-active');
			document.querySelector('#cuerpoDeCorreo').innerHTML=``;
			clearTimeout(tiempoCargaBase);
			checkPage(parseInt(document.querySelector('#now-btn').innerHTML));
		}
	})
}

//ver motivo de cierre:
function getRespuestaEnviada(id){
	var renderizado ="";
	var detallesderespuesta = document.querySelector('#detallesderespuesta').innerHTML;
	$.ajax({
		url : '/getRespuestaEnviada',
		type : "post",
		data : { id },
		beforeSend : function(){
			document.querySelector('#barraProgresiva').style.display="block";
		},
		success : function (res){
			if(res.info.length >0){
				var links="";
				for(var x= 0; x<res.info.length; x++){

					//crear los links:
					if(res.filesend.length > 0 ){
						for(var y=0; y< res.filesend.length; y++){
							var base64string =_arrayBufferToBase64(res.filesend[y].buffer.data,0, res.filesend[y].contentType);
							links+= showFileAdd(res.filesend[y].contentType, base64string[1], res.filesend[y].filename,res.filesend[y].filename);
						}
					}

					renderizado += Mustache.render(detallesderespuesta,{
						"subject" : res.info[x].asunto,
						"respuesta" : res.info[x].respuesta,
						"codificacion" : res.info[x].codificacion,
						"findEmail" : res.info[x].findEmail,
						"receivedDate" : res.info[x].receivedDate,
						"fechaderespuesta": moment(parseInt(res.info[x].fechaActualizacion)).format('YYYY-MM-DD HH:mm:ss'),
						"id": res.info[x].id,
						"links" : links
					})
				}
				contentModal.innerHTML=renderizado;
				document.querySelector('.modal').classList.add('is-active');
				document.querySelector('#barraProgresiva').style.display="none";
			}
		}
	})
}

//active button using class
function findEmailByIdAndSubject(){ //is-selected
	
	var entrada = prompt(`Anexa el Id/Asunto/Correo para buscar`,'');
	if(entrada === null){
		return
	} else {
		if(entrada.length===0){
			alert('Ingrese el dato a buscar!')
		}
		//el estado debe ser cerrado o historico.
		estado = "";
		$.ajax({
			url : '/findEmailByIdAndSubject',
			type : "post",
			data : { estado , entrada },
			beforeSend : function(){
				clearTimeout(tiempoderecarga)
				document.querySelector('#btn-reload').removeAttribute('class');
				document.querySelector('#btn-reload').setAttribute('class','button is-primary is-outlined')
				document.querySelector('#btn-close').removeAttribute('class');
				document.querySelector('#btn-close').setAttribute('class','button is-danger is-outlined')
				document.querySelector('#barraProgresiva').style.display="block";
			},
			success : function(res){
				if(typeof res.listaMensajes !== "undefined"){
					clearTimeout(tiempoCargaBase);
					listRender(res.listaMensajes,perPage=11)
				} else {
					alert(`No se encontro nada con la informacion anexada : ${entrada}`);
				}
			}
		})
	}
}

//busqueda mediante del input:
function search() {
	var finderWord = document.querySelector('#campobusqueda').value;
	if(finderWord.length >= 2){
		if(isNaN(finderWord)){
			var articles = document.querySelectorAll('aside ul li');
			for(var e=0; e<articles.length; e++){
				if(articles[e].title.toLowerCase().indexOf(finderWord.toLowerCase()) >-1 ){
					articles[e].style.display="block";
				} else{
					articles[e].style.display="none";
				}
			}
		} else {
			var articles = document.querySelectorAll('aside ul li');
			for(var e=0; e<articles.length; e++){
				if(articles[e].id == parseInt(finderWord)  ){
					articles[e].style.display="block";
				} else{
					articles[e].style.display="none";
				}
			}
		}
	} else {
		var articles = document.querySelectorAll('aside ul li');
		for(var e=0; e<articles.length; e++){
			if(typeof articles[e].id !== "undefined" ){
				articles[e].style.display="block";
			} else{
				articles[e].style.display="none";
			}
		}
	}
}




