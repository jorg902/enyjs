function getMailTxt(){
   $.ajax({
      url: "/getMailTxt",
      type:"put",
      beforeSend : function(){
         console.log("buscando correos txt")
         document.querySelector('#block-content').innerHTML=``;
      },
      success : function(res){
         document.querySelector('#closeSection').style.display='block';
         document.querySelector('#block-content').innerHTML=res;
      }
   })
}

function editMailActive(email){
   $.ajax({
      url: "/editMailActive",
      type:"put",
      data: { "archivo" : email },
      beforeSend : function(){
         console.log("buscando correosa editar txt")
      },
      success : function(res){
         document.querySelector('.modal').classList.add('is-active');
         document.querySelector('#contenido-modal').innerHTML=res;
      }
   })
}
/** crear el un nuevo correo, el cual genera dos files pop and smtp: */
function newEmailFile(){
   $.ajax({
      url: "/newEmailFile",
      type:"put",
      beforeSend : function(){
         console.log("buscando correosa editar txt")
      },
      success : function(res){
         document.querySelector('.modal').classList.add('is-active');
         document.querySelector('#contenido-modal').innerHTML=res;
      }
   })
}

/** actaulizar/ o crear archivo depende del contenido del formulario: */
function saveOrUpdateFile(){
   var usertxt = document.querySelector('#usertxt').value;
   var passtxt = document.querySelector('#passtxt').value;
   let fl4g_ = false; 
   
   if(usertxt.length === 0 || passtxt.length === 0){
      return alert("Por favor no deje campos vacios!")
   }
   var datos = `username=${usertxt}\npassword=${passtxt}`;
   
   //validar si ya existe o no:
   var archivoObtenido = document.querySelector('#fileUpdate').value;
   if(archivoObtenido.length === 0 ){ fl4g_ = true ; }

   if(fl4g_ === true){
      //es nuevo ciclo para doble envio por segundos:
      var extensionFile = "";
      let checkMakefile=0;
      for(var x=0; x<2; x++){
         switch(x){
            case 0 :
               extensionFile = ".pop.txt";
               break;
            case 1:
               extensionFile = ".smtp.txt";
               break;
         }
         $.ajax({
            url :"/saveOrUpdateFile",
            type : "post",
            data : { datos , "archivo": usertxt.split('@')[0] + extensionFile },
            beforeSend : function(){
               console.log("crear file",extensionFile)
            }, 
            success : function(res){
               checkMakefile = checkMakefile + res.respuesta;
            }
         })
      }
      if(checkMakefile == 2){
         document.querySelector('.modal').classList.remove('is-active');
         document.querySelector('#contenido-modal').innerHTML=``;
         return alert("se creo y se agrego la informacion al archivo!");
      } else{
         return alert("No se creo y no se agrego la informacion al archivo!");
      }
   } else{
      //actualizar archivo:
      $.ajax({
         url :"/saveOrUpdateFile",
         type : "post",
         data : { datos , "archivo":  archivoObtenido },
         beforeSend : function(){
            console.log("actualizando.... file")
         }, 
         success : function(res){
            console.log(res);
            if(res.respuesta == 1){
               document.querySelector('#contenido-modal').innerHTML=``;
               document.querySelector('.modal').classList.remove('is-active');
               return alert("se actualizo la informacion del archivo!");
            } else {
               return alert("No se pudo actualizar la informacion del archivo!");
            }
         }
      })
   }
}

/** espacio para ajustar el horario de trabajo!. */
function getTimeToWork(){
   $.ajax({
      url: "/getTimeToWork",
      type:"put",
      data: { "archivo" : "horario.txt" },
      beforeSend : function(){
         console.log("buscando correos txt")
         document.querySelector('#block-content').innerHTML=``;
      },
      success : function(res){
         document.querySelector('#closeSection').style.display='block';
         document.querySelector('#block-content').innerHTML=res;
      }
   })
}

function updateTimeToWork(){
   var start_ = document.querySelector('#start_').value;
   var end_ = document.querySelector('#end_').value;
   
   if(start_.length === 0 || end_.length === 0){
      return alert("Favor llene los horarios no deje campos vacios!")
   }

   var datos = `time=${start_}\ntime=${end_}`;
   $.ajax({
      url: "/updateTimeToWork",
      type : "post",
      data : { datos, "archivo" : "horario.txt" },
      beforeSend : function(){

      },
      success : function(res){
         if(res.respuesta == 1){
            document.querySelector('#block-content').innerHTML=``;
            return alert("se actualizo el horario de servicio");
         } else {
            return alert("No se pudo actualizar la hora del servicio!");
         }
      }
   })
}
/* fin de la seccion horario a trabajar:*/

/** espacio para agregar, eliminar, editar la lista negra, por el momento usa asunto. */
function getBlackList(){
   $.ajax({
      url: "/getBlackList",
      type:"put",
      data: { "archivo" : "listanegra.txt" },
      beforeSend : function(){
         console.log("buscando correos txt")
         document.querySelector('#block-content').innerHTML=``;
      },
      success : function(res){
         document.querySelector('#closeSection').style.display='block';
         document.querySelector('#block-content').innerHTML=res;
      }
   })
}

function updateBlackList(){
   var listanegra = document.querySelector('#blockmails').value;

   if(listanegra.length === 0){
      return alert(`No deje vacio el area!`)
   }

   $.ajax({
      url: "/listaNegraUpdate",
      type : "post",
      data : { listanegra, "archivo" : 'listanegra.txt'},
      beforeSend : function(){

      },
      success : function(res){
         if(res.respuesta == 1){
            document.querySelector('#block-content').innerHTML=``;
            return alert("se actualizo la lista negra");
         } else {
            return alert("No se pudo actualizar la lista negra!");
         }
      }
   })
}
/** fin del espacio para la lista negra:  */

/** seccion para cerrra el espacio de configuracion: */
function closeSection(){
   document.querySelector('#block-content').innerHTML=``;
   document.querySelector('#closeSection').style.display='none';
}
/** fin del cierre de espacio a configurar: */

/** seccion de alejandro: */
function addStaff() {
	$.ajax({
		url: "/addStaff",
		type : "put",
		success : function(res){
         document.querySelector('.modal').classList.add('is-active');
			contentModal.innerHTML = res;
		}
	});
}

function saveStaff() {
	
	//bring all the fields
	let nombres = document.querySelector('#nombres').value;
	let apellidos = document.querySelector('#apellidos').value;
	let email = document.querySelector('#email').value;
	let depto = document.querySelector('#depto').value;
	let usuario = document.querySelector('#usuario').value;
	let contrasenia = document.querySelector('#contrasenia').value;
	let privilegio = document.querySelector('#privilegio').value;
	let firma = document.querySelector('#firma').files[0];
	
	//validator
	if(nombres.length == 0 || apellidos.length == 0 || email.length == 0 || depto.length == 0 || usuario.length == 0 || privilegio.length == 0) {
		return alert('Llena todos los campos');
	}
	if(contrasenia.length < 10) {
		return alert('Por seguridad, ingresa una contraseña arriba de 10 caracteres, sin símbolos especiales y/o raros.');
	}
	//crear objeto Reader
	const reader =  new FileReader();
	if(firma) {
		reader.readAsDataURL(firma);
		console.log('FIRMA TRUE');
		reader.addEventListener('load', () => {
			//operacion a base64
			firma = reader.result
			
	
			//send data
			$.ajax({
				url:"/saveStaff",
				type: "post",
				data: { nombres, apellidos, email, firma, depto, usuario, contrasenia, privilegio },
				success: function(res) {
					if (res.respuesta != 0) {
						alert(`${nombres}, ha sido registrado exitosamente.`);
						modal.classList.remove('is-active');
	
					}
					else {
						alert(`Surgió problemas al tratar de registrar a ${nombres}`);
					}
				}
	
			});
		});
	} 
	else {
		firma = '0';
		//send data
		$.ajax({
			url:"/saveStaff",
			type: "post",
			data: { nombres, apellidos, email, firma, depto, usuario, contrasenia, privilegio },
			success: function(res) {
				if (res.respuesta != 0) {
					alert(`${nombres}, ha sido registrado exitosamente.`);
					modal.classList.remove('is-active');
				}
				else {
					alert(`Surgió problemas al tratar de registrar a ${nombres}`);
				}
			}
		});
	}
		
}
