// 1. Declaramos la variable global al inicio
let listarPersonalGlobal = [];

const urlParams = new URLSearchParams(window.location.search); 
const tablaPersonal = document.getElementById('tabla-Personal');
const idPersonal = urlParams.get('comunidad');
const buscarPersonalInput = document.getElementById('buscar-Personal');

/** 
 * 
 * * @param {Array} Personal -
*/
function pintarTabla(Personal) {
    tablaPersonal.innerHTML = ``;

    if (Personal.length === 0) {
        tablaPersonal.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 25px; color: #777; font-weight: bold;">
                    No se encontraron usuarios de personal registrados con esos criterios.
                </td>
            </tr>`; 
        return; 
    }

    Personal.forEach(personal => { 
        const fila = document.createElement('tr');

        fila.innerHTML = `
        <td>${personal.id_usuario || 'S/N'}</td>
        <td>${personal.nombre || 'S/N'}</td>
        <td>${personal.Apellido_Paterno || 'S/N'}</td>
        <td>${personal.Apellido_Materno || 'S/N'}</td>
        <td>${personal.usuario || 'S/N'}</td>
        <td>${personal.nombre_rol || 'S/N'}</td>
        <td>
            <a href="#" onclick="editarPersonal(${personal.id_usuario})" style="color: #000000; font-weight: bold; text-decoration: none;">EDITAR</a> | 
            <a href="#" onclick="eliminarPersonal(${personal.id_usuario})" style="color: #c92a2a; font-weight: bold; text-decoration: none;">ELIMINAR</a>
        </td>
        `;

        tablaPersonal.appendChild(fila);
    });
}


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


if (buscarPersonalInput) {
    buscarPersonalInput.addEventListener('input', (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();

        const PersonalFiltrados = listarPersonalGlobal.filter(personal => {
            const nombre = personal.nombre || '';
            const paterno = personal.Apellido_Paterno || '';
            const materno = personal.Apellido_Materno || '';
            
            const nombreCompleto = `${nombre} ${paterno} ${materno}`.toLowerCase();
            
            return nombreCompleto.includes(textoBusqueda) || 
                   (personal.id_usuario && personal.id_usuario.toString().includes(textoBusqueda));
        });

        pintarTabla(PersonalFiltrados);
    });
}


function editarPersonal(id_usuario) {
    // Te manda a la carpeta correspondiente llevando el "?edit=ID"
    window.location.href = `../opc_Administrador/agregar_y_editar/Update-personal.html?edit=${id_usuario}`;
}


function eliminarPersonal(id_usuario) {
    if(confirm('¿Seguro que deseas eliminar a este usuario?')) {
        console.log('Eliminando usuario con ID:', id_usuario);
        // Aquí meterás tu fetch DELETE más adelante
    }
}