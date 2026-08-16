// 1. Declaramos la variable global al inicio
let listarPersonalGlobal = [];

const urlParams = new URLSearchParams(window.location.search); 
const tablaPersonal = document.getElementById('tabla-Personal');
const idPersonal = urlParams.get('comunidad');
const buscarPersonalInput = document.getElementById('buscar-Personal');

/** 
 * Pintar filas de la tabla de Personal
 * @param {Array} Personal
 */
function pintarTabla(Personal) {
    if (!tablaPersonal) return;
    
    tablaPersonal.innerHTML = ``;

    if (!Array.isArray(Personal) || Personal.length === 0) {
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
        <td>${personal.estado || 'S/N'}</td>
        <td>
            <a href="#" onclick="editarPersonal(${personal.id_usuario}); return false;" style="color: #000000; font-weight: bold; text-decoration: none;">EDITAR</a> | 
            <a href="#" onclick="eliminarPersonal(${personal.id_usuario}); return false;" style="color: #c92a2a; font-weight: bold; text-decoration: none;">ELIMINAR</a>
        </td>
        `;

        tablaPersonal.appendChild(fila);
    });
}

// =========================================================================
// CARGA DE USUARIOS (CON RESPALDO EN LOCALHOST)
// =========================================================================
async function cargarUsuarios() {
    if (!tablaPersonal) return;

    const endpoint = '/api/usuarios/';
    let response;

    try {
        // 💡 1. Primer intento: Usando la IP dinámica del servidor
        response = await fetch(`http://${window.location.hostname}:3000${endpoint}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        try {
            // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
            response = await fetch(`http://localhost:3000${endpoint}`);
        } catch (localError) {
            console.error('❌ Error crítico al conectar con el servidor:', localError);
            tablaPersonal.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; color: #d94141; padding: 25px; font-weight: bold;">
                        Error de conexión. Asegúrate de que tu backend de Node.js esté corriendo en el puerto 3000.
                    </td>
                </tr>`;
            return;
        }
    }

    try {
        if (!response || !response.ok) {
            throw new Error('Error al conectar con el servidor');
        }
        
        listarPersonalGlobal = await response.json();
        pintarTabla(listarPersonalGlobal);

    } catch (error) {
        console.error('Error al procesar la lista de usuarios:', error);
    }
}

// Iniciar la carga de usuarios
cargarUsuarios();

// =========================================================================
// BUSCADOR EN TIEMPO REAL
// =========================================================================
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

// =========================================================================
// ELIMINAR USUARIO (CON RESPALDO EN LOCALHOST)
// =========================================================================
async function eliminarPersonal(id_usuario) {
    if (confirm('¿Seguro que deseas eliminar a este usuario?')) {
        console.log('Eliminando usuario con ID:', id_usuario);

        const endpointDelete = `/api/usuarios/Delete/${id_usuario}`;
        let response;

        try {
            // 💡 1. Primer intento: IP Dinámica
            response = await fetch(`http://${window.location.hostname}:3000${endpointDelete}`, {
                method: 'DELETE'
            });
        } catch (netError) {
            console.warn("⚠️ Falló eliminación por IP/Red. Intentando por localhost...");
            try {
                // 🔄 2. Segundo intento: Localhost
                response = await fetch(`http://localhost:3000${endpointDelete}`, {
                    method: 'DELETE'
                });
            } catch (localError) {
                console.error('Error crítico al intentar eliminar:', localError);
                alert('Hubo un error de conexión con el servidor.');
                return;
            }
        }

        try {
            if (!response || !response.ok) {
                throw new Error('No se pudo eliminar el usuario de la base de datos.');
            }

            const data = await response.json();

            if (data.success) {
                alert(data.message || 'Usuario eliminado con éxito'); 

                // ACTUALIZACIÓN EN VIVO: Filtramos el array global para quitar al usuario eliminado
                listarPersonalGlobal = listarPersonalGlobal.filter(p => p.id_usuario !== id_usuario);
                
                // Volvemos a renderizar la tabla con la lista actualizada
                pintarTabla(listarPersonalGlobal);
            } else {
                alert('Error: ' + (data.message || 'No se pudo completar la acción.'));
            }

        } catch (error) {
            console.error('Error al procesar eliminación:', error);
            alert('Error procesando la respuesta del servidor.');
        }
    }
}