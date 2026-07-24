vaScript

const nombreUsuario = document.getElementById('nombre-usuario');
const rol = document.getElementById('rol');


function cargarDatosUsuario() {
    const nombre = localStorage.getItem('usuarioNombre');
    const rolUsuario = localStorage.getItem('usuarioRol');

    
    if (nombre && rolUsuario) {
        nombreUsuario.textContent = nombre;
        rol.textContent = `(${rolUsuario})`;
    } else {
        nombreUsuario.textContent = "Usuario";
        rol.textContent = "(Invitado)";
    }
}

document.addEventListener('DOMContentLoaded', cargarDatosUsuario);



let listarPersonalGlobal = [];
fetch('http://localhost:3000/api/usuarios/')
.then(response => {
    if (!response.ok) {
        throw new Error('Error al conectar con el servidor');
    }
    return response.json();
})
.then(data => {
    listarPersonalGlobal = data;
    pintarTabla(listarPersonalGlobal);
})
.catch(error => {
    console.error('Error en la petición', error);
    tablaPersonal.innerHTML = `
        <tr>
            <td colspan="13" style="text-align: center; color: #d94141; padding: 25px; font-weight: bold;">
                Error de conexión. Asegúrate de que tu backend de Node.js esté corriendo en el puerto 3000.
            </td>
        </tr>`;
});