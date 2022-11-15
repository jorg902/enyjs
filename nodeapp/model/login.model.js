const base323 = require('../db/base145.js');

module.exports = {

    login : async (datosIn)=>{
        var query = `SELECT * FROM correos555.personal WHERE usuario = '${datosIn.usuario}' AND contrasenia = '${datosIn.contrasenia}';`;
        return await base323.select(query);
    }











}