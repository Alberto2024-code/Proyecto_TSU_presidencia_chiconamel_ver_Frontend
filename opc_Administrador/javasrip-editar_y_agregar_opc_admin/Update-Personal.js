const urlParams = new URLSearchParams(window.location.search);
const idUsuarioEdit = urlParams.get('edit'); 

// Variables globales para preservar los datos obligatorios de la base de datos
let passwordOriginal = "";
let rolOriginal = 1;      // Valor por defecto en tu BD
let estadoOriginal = "Activo"; // Valor por defecto en tu BD

// Captura de elementos
const formUsuario = document.getElementById('form-usuario');
const tituloPagina = document.getElementById('titulo-pagina');
const encabezadoFormulario = document.getElementById('encabezado-formulario');
const btnGuardar = document.getElementById('btn-guardar');

const inputNombre = document.getElementById('nombre');
const inputPaterno = document.getElementById('apellido-paterno');
const inputMaterno = document.getElementById('apellido-materno');
const inputUsuario = document.getElementById('usuario');
const inputPassword = document.getElementById('password');

// 1. CARGAR DATOS EN MODO EDICIÓN
document.addEventListener('DOMContentLoaded', () => {
    if (idUsuarioEdit) {
        tituloPagina.textContent = "Editar Usuario";
        encabezadoFormulario.textContent = "EDITAR USUARIO EXISTENTE";
        btnGuardar.textContent = "Actualizar Cambios";
        
        fetch(`http://localhost:3000/api/usuarios/usuarios/${idUsuarioEdit}`)
            .then(response => {
                if (!response.ok) throw new Error('No se pudo obtener los datos del usuario');
                return response.json();
            })
            .then(data => {
                const user = Array.isArray(data) ? data[0] : data;
                
                inputNombre.value = user.nombre || '';
                inputPaterno.value = user.Apellido_Paterno || '';
                inputMaterno.value = user.Apellido_Materno || '';
                inputUsuario.value = user.usuario || '';
                
                // GUARDADO DE VALORES OBLIGATORIOS DE MYSQL
                passwordOriginal = user.password || '';
                rolOriginal = user.rol !== undefined ? user.rol : 1;
                estadoOriginal = user.estado || 'Activo';

                inputPassword.value = passwordOriginal; 
            })
            .catch(error => {
                console.error('Error al cargar datos:', error);
                alert('Error al cargar los datos del usuario para editar.');
            });
    }
});

// 2. ENVIAR FORMULARIO CORREGIDO
formUsuario.addEventListener('submit', (e) => {
    e.preventDefault(); 

    let passwordAEnviar = inputPassword.value.trim();
    if (!passwordAEnviar) {
        passwordAEnviar = passwordOriginal;
    }
  
    // El objeto incluye ahora de forma estricta todos los campos que requiere la BD
    const datosUsuario = {
        nombre: inputNombre.value.trim(),
        Apellido_Paterno: inputPaterno.value.trim(),
        Apellido_Materno: inputMaterno.value.trim(),
        usuario: inputUsuario.value.trim(),
        password: passwordAEnviar,
        rol: rolOriginal,        // Enviado de forma transparente al backend
        estado: estadoOriginal   // Enviado de forma transparente al backend
    };

    let url = '';
    if (idUsuarioEdit) {
        url = `http://localhost:3000/api/usuarios/Update/${idUsuarioEdit}`;
    } else {
        url = 'http://localhost:3000/api/usuarios/incert';
    }
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosUsuario)
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error en el servidor: ${response.status}`);
        return response.json();
    })
    .then(data => {
        alert(idUsuarioEdit ? '¡Usuario actualizado con éxito!' : '¡Usuario registrado con éxito!');
        window.location.href = '../../html/usuarios.html'; 
    })
    .catch(error => {
        console.error('Error detallado en la operación:', error);
        alert('Hubo un error al intentar guardar los datos del usuario. Verifica que el nombre de usuario no esté duplicado.');
    });
});