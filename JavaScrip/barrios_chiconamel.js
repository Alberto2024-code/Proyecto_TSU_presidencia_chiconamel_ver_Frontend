const urlParams = new URLSearchParams(window.location.search);
const idComunidad = urlParams.get('comunidad');
const buscarCivilInput = document.getElementById('buscar-civil');
const tablaUsuarios = document.getElementById('tabla-usuarios'); 

let listaCivilesGlobal = [];

/**
 * Pinta los ciudadanos en la tabla HTML
 * @param {Array} civiles - Lista de ciudadanos a desplegar
 */
function pintarTabla(civiles) {
    if (!tablaUsuarios) return;
    
    tablaUsuarios.innerHTML = ''; 

    if (!Array.isArray(civiles) || civiles.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 25px; color: #777; font-weight: bold;">
                    No se encontraron ciudadanos registrados con esos criterios.
                </td>
            </tr>`;
        return;
    }

    civiles.forEach(civil => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${civil.id_ciudadano || 'S/N'}</td>
            <td>${civil.nombre || ''}</td>
            <td>${civil.apellido_paterno || 'S/N'}</td>
            <td>${civil.apellido_materno || 'S/N'}</td>
            <td>${civil.cuenta_no || 'S/N'}</td>
            <td>${civil.domicilio || 'Conocido'}</td>
            <td>${civil.nombre_servicio || 'Domestico'}</td>
            <td>${civil.nombre_comunidad || 's/n'}</td>
            <td>
                <span class="badge-${civil.estado === 'Activo' ? 'activo' : 'inactivo'}">
                    ${civil.estado || 'Activo'}
                </span>
            </td>
            <td>
                <a href="../html/generar_recibo_empleado.html?cuenta=${civil.cuenta_no}&comunidad=${idComunidad}&accion=cobrar" class="link-cobrar">Cobrar</a>
            </td>
            <td>
                <a href="../html/historial_recibo_empleado.html?id=${civil.id_ciudadano}" class="btn-ver-recibo">Ver Historial</a>
            </td>
        `;
        
        tablaUsuarios.appendChild(fila);
    });
}

// =========================================================================
// CARGA DE CIVILES DE LA COMUNIDAD (CON RESPALDO SIN RED)
// =========================================================================
async function obtenerCivilesComunidad() {
    if (!idComunidad) {
        if (tablaUsuarios) {
            tablaUsuarios.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 20px;">Falta el ID de la comunidad en la URL.</td></tr>`;
        }
        return;
    }

    const endpoint = `/api/civiles/civiles/comunidad/${idComunidad}`;
    let response;

    try {
        // 💡 1. Primer intento: Usando la IP dinámica del servidor
        response = await fetch(`http://${window.location.hostname}:3000${endpoint}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        try {
            // 🔄 2. Segundo intento (Respaldo sin red/TP-Link): conecta a localhost
            response = await fetch(`http://localhost:3000${endpoint}`);
        } catch (localError) {
            console.error('❌ Error crítico al conectar con Node.js:', localError);
            if (tablaUsuarios) {
                tablaUsuarios.innerHTML = `
                    <tr>
                        <td colspan="13" style="text-align: center; color: #d94141; padding: 25px; font-weight: bold;">
                            Error de conexión. Asegúrate de que tu backend de Node.js esté corriendo en el puerto 3000.
                        </td>
                    </tr>`;
            }
            return;
        }
    }

    try {
        if (!response.ok) {
            throw new Error('Error al obtener datos del servidor');
        }
        const data = await response.json();
        listaCivilesGlobal = data; 
        pintarTabla(listaCivilesGlobal);
    } catch (error) {
        console.error('❌ Error en el procesamiento de datos:', error);
    }
}

// Ejecutamos la carga al inicializar
obtenerCivilesComunidad();

// =========================================================================
// EVENTO DE BÚSQUEDA / FILTRADO EN TIEMPO REAL
// =========================================================================
if (buscarCivilInput) {
    buscarCivilInput.addEventListener('input', (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();

        const civilesFiltrados = listaCivilesGlobal.filter(civil => {
            const nombreCompleto = `${civil.nombre || ''} ${civil.apellido_paterno || ''} ${civil.apellido_materno || ''}`.toLowerCase();
            return nombreCompleto.includes(textoBusqueda) || 
                   (civil.cuenta_no && civil.cuenta_no.toString().includes(textoBusqueda));
        });

        pintarTabla(civilesFiltrados);
    });
}

function editarCivil(id_ciudadano) {
    window.location.href = `../opc_Administrador/agregar_y_editar/Update_civiles-adm.html?edit=${id_ciudadano}`;
}

// =========================================================================
// FUNCIÓN PARA ELIMINAR CIUDADANO (CON RESPALDO SIN RED)
// =========================================================================
async function eliminarCivil(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        console.log("Eliminando ciudadano ID:", id);
        
        const endpoint = `/api/civiles/Delete/${id}`;
        let response;

        try {
            // 💡 1. Primer intento: Usando la IP dinámica
            response = await fetch(`http://${window.location.hostname}:3000${endpoint}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (netError) {
            console.warn("⚠️ Falló eliminación por IP/Red. Intentando por localhost...");
            try {
                // 🔄 2. Segundo intento: Localhost
                response = await fetch(`http://localhost:3000${endpoint}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (localError) {
                console.error('Error crítico al conectar con el servidor:', localError);
                alert('Hubo un error de conexión con el servidor.');
                return;
            }
        }

        try {
            const data = await response.json();

            if (response && response.ok) {
                alert('¡Ciudadano eliminado con éxito!');
                location.reload(); 
            } else {
                alert(`Error en el servidor: ${data.message || 'No se pudo eliminar el registro.'}`);
            }
        } catch (error) {
            console.error('Error procesando respuesta del backend:', error);
            alert('Error al procesar la respuesta del servidor.');
        }
    }
}