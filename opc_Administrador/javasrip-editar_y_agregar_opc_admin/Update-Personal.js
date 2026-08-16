// ==========================================
// FUNCIÓN AUXILIAR CON TOLERANCIA A FALLOS (Host/IP -> Localhost)
// ==========================================
async function fetchConFallback(endpoint, opciones = {}) {
    try {
        // 💡 1. Primer intento: Host/IP dinámica detectada en la URL
        return await fetch(`http://${window.location.hostname}:3000${endpoint}`, opciones);
    } catch (netError) {
        console.warn(`⚠️ Falló la conexión por IP/Red (${endpoint}). Intentando fallback a localhost...`);
        // 🔄 2. Segundo intento (Respaldo sin red local): localhost
        return await fetch(`http://localhost:3000${endpoint}`, opciones);
    }
}

// 1. Capturar el ID del usuario directamente desde la URL (?edit=1)
const urlParams = new URLSearchParams(window.location.search);
const idUsuario = urlParams.get('edit'); 

// ==========================================
// PASO A: CARGAR LOS DATOS CUANDO SE ABRE LA PÁGINA
// ==========================================
async function cargarDatosUsuario() {
    if (!idUsuario) {
        alert("Error: No se encontró el ID del usuario en la URL.");
        return;
    }

    try {
        // Hacemos una petición GET al backend para traer los datos de este usuario dinámicamente
        const response = await fetchConFallback(`/api/usuarios/${idUsuario}`);
        
        if (response && response.ok) {
            const usuario = await response.json();
            
            // Rellenamos las cajas del formulario con la información actual de la BD
            document.getElementById('nombre').value = usuario.nombre || '';
            document.getElementById('apellido-paterno').value = usuario.Apellido_Paterno || '';
            document.getElementById('apellido-materno').value = usuario.Apellido_Materno || '';
            document.getElementById('usuario').value = usuario.usuario || '';
            
            if (document.getElementById('rol')) {
                document.getElementById('rol').value = usuario.rol || '1';
            }
            if (document.getElementById('estado')) {
                document.getElementById('estado').value = usuario.estado || 'Activo';
            }
        } else {
            alert('No se pudieron obtener los datos actuales del usuario.');
        }
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
    }
}

// Ejecutamos la función de carga en cuanto se abre la ventana
document.addEventListener('DOMContentLoaded', cargarDatosUsuario);


// ==========================================
// PASO B: GUARDAR LOS DATOS ACTUALIZADOS
// ==========================================
const formUsuario = document.getElementById('form-usuario');
if (formUsuario) {
    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!idUsuario) {
            alert("Error: No se encontró el ID del usuario en la URL.");
            return;
        }

        const datosActualizados = {
            nombre: document.getElementById('nombre').value,
            Apellido_Paterno: document.getElementById('apellido-paterno').value,
            Apellido_Materno: document.getElementById('apellido-materno').value,
            usuario: document.getElementById('usuario').value,
            rol: document.getElementById('rol') ? document.getElementById('rol').value : "1", 
            estado: document.getElementById('estado') ? document.getElementById('estado').value : "Activo"
        };

        try {
            const response = await fetchConFallback(`/api/usuarios/Update/${idUsuario}`, {
                method: 'PUT', 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response) {
                throw new Error('No se obtuvo respuesta del servidor backend.');
            }

            const resultado = await response.json();

            if (response.ok) {
                alert('¡Usuario actualizado con éxito!');
            } else {
                alert('Error del servidor: ' + (resultado.message || 'No se pudo actualizar.'));
            }

        } catch (error) {
            console.error('Error en la petición FETCH:', error);
            alert('No se pudo establecer conexión con el servidor backend.');
        }
    });
}