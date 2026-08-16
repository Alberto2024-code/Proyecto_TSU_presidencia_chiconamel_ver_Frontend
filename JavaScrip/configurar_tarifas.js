// --- FUNCIÓN PARA OBTENER Y MOSTRAR LAS TARIFAS EN LA TABLA ---
async function cargarTarifasEnTabla() {
    const tbody = document.getElementById('tabla-tarifa');
    
    // Si la tabla no existe en esta vista, detenemos la función para evitar errores
    if (!tbody) return; 

    const urlEndpoint = '/api/tarifas/';
    let respuesta;

    try {
        // 💡 1. Primer intento: Hacer la petición GET a la API usando la IP dinámica actual
        respuesta = await fetch(`http://${window.location.hostname}:3000${urlEndpoint}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        try {
            // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
            respuesta = await fetch(`http://localhost:3000${urlEndpoint}`);
        } catch (localError) {
            console.error('❌ Error crítico al conectar con el servidor de tarifas:', localError);
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; color: red; font-weight: bold;">
                        Error al conectar con el servidor. Revisa que Node.js esté activo.
                    </td>
                </tr>`;
            return;
        }
    }

    try {
        if (!respuesta || !respuesta.ok) {
            throw new Error('No se pudieron obtener las tarifas del servidor.');
        }

        const tarifas = await respuesta.json();

        // 2. Limpiar la tabla por si tiene datos viejos o estáticos
        tbody.innerHTML = '';

        // 3. Validar si la API regresó datos
        if (!Array.isArray(tarifas) || tarifas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; color: gray;">
                        No hay tarifas ni multas registradas actualmente.
                    </td>
                </tr>`;
            return;
        }

        // 4. Recorrer el arreglo de tarifas y construir las filas en puro JS
        tarifas.forEach(tarifa => {
            const fila = document.createElement('tr');

            // Formateamos las fechas para que no se vean feas (ej: de "2026-06-15T00:00:00.000Z" a "15/06/2026")
            const fInicio = tarifa.fecha_inicio ? new Date(tarifa.fecha_inicio).toLocaleDateString('es-MX') : 'N/A';
            const fTermino = tarifa.fecha_termino ? new Date(tarifa.fecha_termino).toLocaleDateString('es-MX') : 'N/A';

            fila.innerHTML = `
                <td>${tarifa.tipo_servicio || 'N/A'}</td>
                <td>$${parseFloat(tarifa.monto || 0).toFixed(2)}</td>
                <td>${tarifa.anio || '--'}</td>
                <td>$${parseFloat(tarifa.monto_multa || 0).toFixed(2)}</td>
                <td>$${parseFloat(tarifa.monto_descuento || 0).toFixed(2)}</td>
                <td>${tarifa.promocion_name || 'Sin Promoción'}</td>
                <td>${fInicio}</td>
                <td>${fTermino}</td>
                <td>${tarifa.porcentaje || 0}%</td>
                <td>
                    <a href="../opc_Administrador/agregar_y_editar/Update_configuras_tarifas.html?id=${tarifa.id_tarifa}" style="color: #000000; font-weight: bold; text-decoration: none;">CONFIGURAR</a>
                </td>
            `;

            // Insertar la fila en el cuerpo de la tabla
            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al cargar la tabla:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: red; font-weight: bold;">
                    Error al procesar las tarifas. Revisa la consola.
                </td>
            </tr>`;
    }
}

// --- ESCUCHAR EL EVENTO DE CARGA DE LA PÁGINA ---
document.addEventListener('DOMContentLoaded', cargarTarifasEnTabla);