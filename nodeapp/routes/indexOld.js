var express = require('express');
var router = express.Router();
const inicioController = require('../controller/inicio.controller.js');


/* GET home page. */
router.get('/', inicioController.index);
router.get('/inicio', inicioController.inicio);
router.post('/inbox', inicioController.inboxNew);
router.post('/getMailDb',inicioController.getMailDb);
router.post('/getmailid', inicioController.getMailId);
//muestra modal responder a:
router.put('/responderA', inicioController.responderA);
router.post('/sendMail', inicioController.enviar);
router.post('/updateMailResponsed', inicioController.updateMailResponsed)

//configuracion del servicio:
router.get('/configurar', inicioController.configurar);
router.put('/getMailTxt', inicioController.getMailTxt); 
router.put('/getTimeToWork', inicioController.getTimeToWork);
router.put('/getBlackList', inicioController.getBlackList);
router.post('/listaNegraUpdate', inicioController.listaNegraUpdate);
router.post('/updateTimeToWork',inicioController.updateTimeToWork);
router.put('/editMailActive', inicioController.editMailActive);
router.put('/newEmailFile', inicioController.newEmailFile);
router.post('/saveOrUpdateFile', inicioController.saveOrUpdateFile);

router.get('/vista',inicioController.vista);




module.exports = router;
