const loginModel = require('../model/login.model.js');

var sha256 = require('sha-256-js');


module.exports = {

    login: async(req, res) => {

        var datosAcceso = {
            usuario: req.body.usuario,
            contrasenia: sha256(req.body.contrasenia) //Transformamos la variable de contraseña a cifrado md5, ya que los datos de los registrados en la base de 63.215 están de esa manera
        }


        //consultar
        let resultados = await loginModel.login(datosAcceso);


        // console.log(resultados);

        //PRIVILEGES: admin, asesor, supervisor, coordinador

        if(typeof resultados != 'undefined' && resultados.length > 0) {

            var sesion = {    //store in sessiones

                id_personal: req.session.id_personal = resultados[0].id_personal,

                nombre_completo: req.session.nombre_completo = resultados[0].nombres + ' '+resultados[0].apellidos,
                // foto:req.session.foto,
                // req.session.firma,
                email: req.session.email = resultados[0].email,
                depto: req.session.depto =  resultados[0].depto,
                usuario: req.session.usuario =  resultados[0].usuario,
                privilegio: req.session.privilegio = resultados[0].privilegio
            }


            accede = ''; url = '';
            switch( sesion.privilegio ) {

                case 'admin':
                case 'asesor':
                case 'supervisor':
                case 'coordinador':
                        url = '/inicio'; accede = 'si';
                    break;
                default: 
                        accede = 'no';
                    break;
            }

            res.json({ accede: accede, url: url, datos: sesion });
        } 
        else {

            res.json({ accede: 'error'});

        }
    },

    inicioAdmin: async(req, res) => {

        //validar que no haya morido la sesion
        if( typeof req.session.id_personal === 'undefined' ) {

            console.log('\nSesión muerta, se ha redirigido a la raíz(ADMIN)\n');

            res.redirect('/');

        }
        else {

            var misDatos = {
                
                id_personal: req.session.id_personal,
                nombre_completo: req.session.nombre_completo,
                foto: req.session.foto,
                email: req.session.email,
                depto: req.session.depto,
                usuario: req.session.usuario,
                privilegio: req.session.privilegio
            }
            res.redirect('/inicio');
            //res.render('./inicio.ejs', { title: 'ADMIN | INICIO', misDatos });
        }
    },
    salir: async (req, res) => {
        
        req.session.destroy( error => {

            if(error) {
                console.log('SE PRODUJO UN ERROR AL CERRAR SESIÓN' );
                res.status(400).send('Unable to log out');
            }
            else {
                console.log('SESIÓN CERRADA');
                res.redirect('/');
            }
        });

    }
    
}