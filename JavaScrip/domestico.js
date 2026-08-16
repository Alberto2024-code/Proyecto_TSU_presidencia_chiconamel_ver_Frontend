// 1. Declaramos la variable global para almacenar los datos que vengan de la API
let ciudadanosGlobal = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarServiciosDomesticos();

    // Configurar el evento del buscador
    const inputBuscador = document.querySelector('.search-container input');
    
    if (inputBuscador) {
        inputBuscador.addEventListener("input", (e) => {
            const busqueda = e.target.value.toLowerCase().trim();

            // Filtrar sobre la variable global
            const filtrados = ciudadanosGlobal.filter(item => {
                const nombreCompleto = `${item.nombre || ''} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`.toLowerCase();
                const cuenta = String(item.cuenta_no || '').toLowerCase();
                
                return nombreCompleto.includes(busqueda) || cuenta.includes(busqueda);
            });

            // 🎯 SOLUCIÓN AL PROBLEMA: Pintar los resultados filtrados en la tabla
            renderizarTabla(filtrados);
        });
    }
});

async function cargarServiciosDomesticos() {
    let respuesta;
    const urlEndpoint = '/api/civiles/domesticos';

    try {
        // 💡 1. Primer intento: Ruta dinámica usando la IP actual
        respuesta = await fetch(`http://${window.location.hostname}:3000${urlEndpoint}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        
        try {
            // 🔄 2. Segundo intento (Respaldo si no hay red/TP-Link): conecta a localhost
            respuesta = await fetch(`http://localhost:3000${urlEndpoint}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (localError) {
            console.error("❌ Error crítico: El servidor backend no está respondiendo en ninguna ruta.", localError);
            alert("No se pudo conectar con el servidor. Verifica que Node.js esté activo.");
            return;
        }
    }

    try {
        if (!respuesta || !respuesta.ok) {
            throw new Error("No se pudo conectar con el servidor para traer los datos.");
        }

        // Guardamos los datos en la variable global
        ciudadanosGlobal = await respuesta.json();
        
        // Renderizamos la tabla por primera vez con todos los datos
        renderizarTabla(ciudadanosGlobal);

    } catch (error) {
        console.error("Error al llenar la tabla:", error);
        alert("Hubo un problema al cargar el listado del servicio doméstico.");
    }
}

// 🎨 Función encargada de dibujar las filas en la tabla
function renderizarTabla(lista) {
    // Apuntamos al tbody de tu HTML
    const tablaCuerpo = document.getElementById("tabla-usuarios") || document.getElementById("tabla-rezagados");
    
    if (!tablaCuerpo) return;

    tablaCuerpo.innerHTML = ""; // Limpiamos el contenido anterior

    if (!Array.isArray(lista) || lista.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 15px;">No se encontraron registros.</td></tr>`;
        return;
    }

    lista.forEach(c => {
        const fila = document.createElement("tr");

        const estadoLimpio = c.estado ? c.estado.toLowerCase() : 'desconocido';

        fila.innerHTML = `
            <td>${c.id || c.id_usuario || '--'}</td>
            <td>${c.nombre || ''}</td>
            <td>${c.apellido_paterno || ''}</td>
            <td>${c.apellido_materno || ''}</td>
            <td>${c.cuenta_no || 'N/A'}</td>
            <td>${c.comunidad || ''}</td>
            <td>${c.domicilio || ''}</td>
            <td><span class="badge-domestico">${c.tipo_servicio === 1 ? 'DOMÉSTICO' : (c.tipo_servicio || 'DOMÉSTICO')}</span></td>
            <td><span class="estado-${estadoLimpio}">${c.estado || 'Activo'}</span></td>
        `;

        tablaCuerpo.appendChild(fila);
    });
}