document.addEventListener('DOMContentLoaded', () => {
    const tablaBody = document.querySelector('.tabla-usuarios tbody');
    const inputBuscador = document.querySelector('.search-container input');
    
    // Guardaremos aquí los datos originales para poder filtrar
    let datosCortes = [];

    // 1. Función para consumir la API con Respaldo en Localhost
    const obtenerCortesMes = async () => {
        if (!tablaBody) return;

        const urlEndpoint = '/api/recibo/reporte/cortes-mes';
        let respuesta;

        try {
            // 💡 1. Primer intento: Usando la IP dinámica del servidor
            respuesta = await fetch(`http://${window.location.hostname}:3000${urlEndpoint}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                respuesta = await fetch(`http://localhost:3000${urlEndpoint}`);
            } catch (localError) {
                console.error('❌ Error crítico al cargar el reporte de cortes:', localError);
                tablaBody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: red; font-weight: bold;">
                            Error de conexión. Verifica que Node.js esté activo en el puerto 3000.
                        </td>
                    </tr>`;
                return;
            }
        }

        try {
            if (!respuesta || !respuesta.ok) {
                throw new Error('Error al consultar el reporte de cortes');
            }
            
            datosCortes = await respuesta.json();
            renderizarTabla(datosCortes);

        } catch (error) {
            console.error('Error al procesar la respuesta:', error);
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: red;">
                        Error al cargar los datos del reporte.
                    </td>
                </tr>`;
        }
    };

    // 2. Función para pintar los datos dentro del <tbody>
    const renderizarTabla = (lista) => {
        if (!tablaBody) return;
        tablaBody.innerHTML = ''; // Limpiamos la tabla primero

        if (!Array.isArray(lista) || lista.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 15px;">No se encontraron registros.</td>
                </tr>`;
            return;
        }

        lista.forEach((item) => {
            // Formateamos el monto a moneda ($4,460.00)
            const montoFormateado = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(item.total_recaudado || 0);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id || '--'}</td>
                <td>${item.fecha_corte || 'N/A'}</td>
                <td>${item.nombre_comunidad || 'N/A'}</td>
                <td>${montoFormateado}</td>
                <td>${item.usuarios_que_pagaron || 0}</td>
                <td>${item.total_ciudadanos || 0}</td>
            `;
            tablaBody.appendChild(tr);
        });
    };

    // 3. Funcionalidad del Buscador por Nombre de Comunidad
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            
            const resultadosFiltrados = datosCortes.filter(item => {
                const comunidad = (item.nombre_comunidad || '').toLowerCase();
                return comunidad.includes(textoBusqueda);
            });

            renderizarTabla(resultadosFiltrados);
        });
    }

    // Iniciar la carga de datos
    obtenerCortesMes();
});