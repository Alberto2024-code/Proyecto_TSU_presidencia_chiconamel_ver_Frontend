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
    try {
        const respuesta = await fetch('http://localhost:3000/api/civiles/domesticos', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!respuesta.ok) {
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
    // Apuntamos al tbody de tu HTML (asegúrate de que en tu HTML el <tbody> tenga id="tabla-usuarios" o id="tabla-rezagados")
    const tablaCuerpo = document.getElementById("tabla-usuarios") || document.getElementById("tabla-rezagados");
    
    if (!tablaCuerpo) return;

    tablaCuerpo.innerHTML = ""; // Limpiamos el contenido anterior

    if (lista.length === 0) {
        tablaCuerpo.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 15px;">No se encontraron registros.</td></tr>`;
        return;
    }

    lista.forEach(c => {
        const fila = document.createElement("tr");

        const estadoLimpio = c.estado ? c.estado.toLowerCase() : 'desconocido';

        fila.innerHTML = `
            <td>${c.id}</td>
            <td>${c.nombre || ''}</td>
            <td>${c.apellido_paterno || ''}</td>
            <td>${c.apellido_materno || ''}</td>
            <td>${c.cuenta_no || 'N/A'}</td>
            <td>${c.comunidad || ''}</td>
            <td>${c.domicilio || ''}</td>
            <td><span class="badge-domestico">${c.tipo_servicio === 1 ? 'DOMÉSTICO' : c.tipo_servicio}</span></td>
            <td><span class="estado-${estadoLimpio}">${c.estado || 'Activo'}</span></td>
        `;

        tablaCuerpo.appendChild(fila);
    });
}