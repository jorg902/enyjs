var express = require('express');
var router = express.Router();

const loginController = require('../controller/login.controller.js');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index.ejs', { title: 'SISCOR 555 | Login' });
});
router.post('/login', loginController.login);
router.get('/salir', loginController.salir);
router.get('/inicioAdmin', loginController.inicioAdmin);

const inicioController = require('../controller/inicio.controller.js');
//vista de prueba:
router.get('/vista', inicioController.vista);
//inicio vista principal:
router.get('/inicio', inicioController.inicio);
//muestra el modal para responder
router.put('/responderA', inicioController.responderA);
//consulta inbox pop:
router.post('/inbox', inicioController.inboxNew);
//busca en base de datos:
router.post('/getMailDb', inicioController.getMailDb);
//busca el archivo.eml, y sacar su contenido
router.post('/getFileEmail', inicioController.getFileEmail);
//borra un correo posiblemente duplicado o repetido:
router.post('/borrarId', inicioController.borrarId);
//enviar correo de respuesta:
router.post('/sendMail', inicioController.enviar);
//actaulizar el registro de la base:
router.post('/updateMailResponsed', inicioController.updateMailResponsed);
//se obtiene la respuesta ofrecida:
router.post('/getRespuestaEnviada', inicioController.getRespuestaEnviada);
//buscar email, por asunto, correo o id:
router.post('/findEmailByIdAndSubject', inicioController.findEmailByIdAndSubject);
//cuando se envia un nuevo correo abre la plantilla:
router.put('/newEmail', inicioController.newEmail);
//guardar en base el correo
router.post('/saveEmailSend', inicioController.saveEmailSend);
//enviar nuevo correo:
router.post('/enviarNuevoCorreo', inicioController.enviarNuevoCorreo);


//############# rutas alejandro ########################

router.put('/addStaff', inicioController.addStaff);
//REPORTE
router.get('/reportesMail', inicioController.reportesMail);
/*router.put('/deployReportOptions', inicioController.deployReportOptions);
router.post('/getExcel', inicioController.getExcel);*/
router.post('/saveStaff', inicioController.saveStaff);

//############# fin rutas alejandro ########################


//configuracion del servicio:
router.get('/configurar', inicioController.configurar);
router.put('/getMailTxt', inicioController.getMailTxt);
router.put('/getTimeToWork', inicioController.getTimeToWork);
router.put('/getBlackList', inicioController.getBlackList);
router.post('/listaNegraUpdate', inicioController.listaNegraUpdate);
router.post('/updateTimeToWork', inicioController.updateTimeToWork);
router.put('/editMailActive', inicioController.editMailActive);
router.put('/newEmailFile', inicioController.newEmailFile);
router.post('/saveOrUpdateFile', inicioController.saveOrUpdateFile);

module.exports = router;
