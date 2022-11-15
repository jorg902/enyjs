let btnIngresar = document.querySelector('#btn-ingresar');


btnIngresar.addEventListener('click', (e) => {

    e.preventDefault();

    //take values from view
    let usuario = document.getElementById('usuario').value;
    let contrasenia = document.getElementById('contrasenia').value;
    console.log(usuario, contrasenia)
    //validate
    if( usuario.length == 0 || contrasenia.length == 0 ) {

        return alert('Introduce todos tus accesos solicitados');

    }
    // console.log(usuario, contrasenia);

    //send data
    $.ajax({
        url: '/login',
        type: 'POST',
        data: { usuario, contrasenia },
        success: (res) => {
            switch(res.accede) {
                case 'si':
                        var misDatos = res.datos;
                        window.location.href = `${res.url}`
                    break;
                case 'no':
                        alert('NO TIENES PERMISO PARA ACCEDER A ESTA HERRAMIENTA')
                    break;
                case 'error':
                        alert('TUS ACCESOS SON ERRÓNEOS O NO ESTÁS AUTORIZADO/REGISTRADO PARA USAR ESTA HERRAMIENTA');
                    break;
            }
        }
    });
});