//funcion muestra formulario responder a :
function modalNewMail(){
	var usuario = document.querySelector('#usuario-name').innerHTML;
   var datosIn = {
      subject: "",
      to: "",
      messageId: "",
      date: "",
      cc: "",
      references : "",
      modo : 0,
      id : 0,
      usuario : usuario
    }

	$.ajax({
		url : "/newEmail",
		type: "put",
		data : datosIn,
		beforeSend : function(){
			contentModal.innerHTML=	``;
		},
		success : function(res){
			modal.classList.add('is-active');
			contentModal.innerHTML = res;
			document.querySelector('#adjuntosMailSend').innerHTML=``;
		}
	})
}

function previewFileNewMail(){
	var file = document.querySelector('input[type=file]').files[0];
	const reader = new FileReader();
	var fileName = file.name;
	var contentType = file.type;
	var generatedFileName=`${fileName + "_saliente"}.eml`;
	
	reader.addEventListener('load', () =>{
		//valores obtenidos: imagen : evt.target.result, filename: file.name, tipoexten : file.type
		var content = reader.result.split(',')[1];
		var addfile = showFileAdd( contentType,content,fileName,generatedFileName )
		document.querySelector('#adjuntosMailSend').innerHTML += addfile;
	});
	if(file){
		reader.readAsDataURL(file)
	}
}

function getNewMail(){
	document.querySelector('#btnNewMail').disabled = true; 
	var asunto = document.querySelector('#asunto').value;
	var email_ = document.querySelector('#email_').value;
	var usuario_ = document.querySelector('#usuario_').value;
	var cc_ = document.querySelector('#cc_').value;
	var to_ = document.querySelector('#to_').value;
	var msg_ = document.querySelector('#msg_').value;
	var nombrecompleto = document.querySelector('#nombrecompleto').value;

	var adjuntosMail = document.querySelectorAll('#adjuntosMailSend div a'); 
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

	if(to_.length === 0 || msg_.length === 0 || asunto.length === 0 || email_.length === 0){
		return alert('No deje campos vacios!')
	}

	let message = {
		"from": email_,
		"to": to_,
		"subject": asunto,
		"msg": msg_,
		"priority": "normal",
		"cc": cc_,
		"attach": JSON.stringify(attachArray),
		"nombrecompleto": nombrecompleto,
		"usuario": usuario_,
   }
	//cuando llegue envia el ajax
	saveEmailSend(message);
}
function saveEmailSend(emailSave){
	$.ajax({
		url:"/saveEmailSend",
		type : "post",
		data : emailSave,
		beforeSend : function(){
			
		},
		success : function(res){
			if(res.respuesta > 0){
				idinsertado = res.respuesta;
				emailSave.idinsertado = idinsertado;
				enviarEmailNuevo(emailSave)
			} 
		}
	})
}

function enviarEmailNuevo(message){
	
	$.ajax({
		url:"/enviarNuevoCorreo",
		type : "post",
		data : message,
		beforeSend : function(){
			
		},
		success : function(res){
			//console.log("acceptados:",res.respuesta.accepted,"\n"+"rejected:",res.respuesta.rejected);
			if( parseInt(res.envio) == 0){
				//hay error
				alert("existe un error al enviar:",JSON.stringify(res.respuesta))
			} else {
				modal.classList.remove('is-active');
				alert('Correo guardado y enviado!')
			}
		}
	})
}
