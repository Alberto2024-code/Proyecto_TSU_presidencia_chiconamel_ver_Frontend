document.addEventListener('DOMContentLoaded', () => {
    let cobrosDelDiaGlobal = [];

    const inputBuscador = document.getElementById('buscar-rezagado');
    const tbody = document.getElementById('tabla-rezagados');

    // 1. Cargar la información del reporte diario
    cargarReporteDiario();

    // 2. Escuchar el evento de búsqueda
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase().trim();
            const filtrados = cobrosDelDiaGlobal.filter(item => {
                const nombreCompleto = `${item.nombre || ''} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`.toLowerCase();
                const cuenta = String(item.cuenta_no || '').toLowerCase();
                const mes = String(item.mes_pagado || '').toLowerCase();
                return nombreCompleto.includes(busqueda) || cuenta.includes(busqueda) || mes.includes(busqueda);
            });
            renderizarTabla(filtrados);
        });
    }

    async function cargarReporteDiario() {
        try {
            const response = await fetch('http://localhost:3000/api/recibo/'); 
            
            if (!response.ok) {
                throw new Error('Error al consultar el servidor');
            }

            const data = await response.json();
            const listaRecibos = Array.isArray(data) ? data : (data.recibos || data.data || []);

            // Obtener la fecha de hoy en formato local AAAA-MM-DD
            const hoy = new Date();
            const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

            // Filtrar solo los recibos que corresponden al día de hoy
            cobrosDelDiaGlobal = listaRecibos.filter(item => {
                if (!item.fecha_pago) return false;
                
                // Extraer directamente solo la parte "YYYY-MM-DD" para evitar desfasamiento por UTC/Zona Horaria
                const fechaStr = String(item.fecha_pago).slice(0, 10); // Ej: "2026-07-23"
                
                const esPagado = !item.estado_recibo || String(item.estado_recibo).toLowerCase() === 'pagado';
                
                return fechaStr === hoyISO && esPagado;
            });

            renderizarTabla(cobrosDelDiaGlobal);

        } catch (error) {
            console.error('Error al cargar el reporte diario:', error);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="11" style="text-align: center; color: red; font-weight: bold;">
                            Ocurrió un error al cargar la información del reporte diario.
                        </td>
                    </tr>
                `;
            }
        }
    }

    function renderizarTabla(datos) {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (datos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; font-style: italic; color: #666;">
                        No se han registrado pagos el día de hoy.
                    </td>
                </tr>
            `;
            return;
        }

        let totalCobradoHoy = 0;

        datos.forEach((item, index) => {
            const monto = parseFloat(item.total || item.monto || 0);
            totalCobradoHoy += monto;

            // Formatear fecha limpia a DD/MM/AAAA
            let fechaLimpia = '--';
            if (item.fecha_pago) {
                const partes = String(item.fecha_pago).slice(0, 10).split('-');
                if (partes.length === 3) {
                    fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id_recibo || item.id || (index + 1)}</td>
                <td>${fechaLimpia}</td>
                <td>${(item.nombre || '').toUpperCase()}</td>
                <td>${(item.apellido_paterno || '').toUpperCase()}</td>
                <td>${(item.apellido_materno || '').toUpperCase()}</td>
                <td><strong>${item.cuenta_no || item.cuenta || '--'}</strong></td>
                <td>${(item.nombre_comunidad || item.comunidad || '').toUpperCase()}</td>
                <td>${(item.domicilio || 'CONOCIDO').toUpperCase()}</td>
                <td>${(item.tipo_servicio === 1 || String(item.tipo_servicio).toLowerCase() === 'domestico' ? 'DOMÉSTICO' : 'COMERCIAL')}</td>
                <td>${(item.mes_pagado || '').toUpperCase()}</td>
                <td><strong>$ ${monto.toFixed(2)}</strong></td>
            `;
            tbody.appendChild(tr);
        });

        // Fila de Total Alineada Correctamente (10 celdas ocupadas + 1 celda para el monto = 11 Celdas)
        const trTotal = document.createElement('tr');
        trTotal.style.backgroundColor = '#e9ecef';
        trTotal.style.fontWeight = 'bold';
        trTotal.innerHTML = `
            <td colspan="10" style="text-align: right; font-size: 1.1em;">TOTAL COBRADO HOY:</td>
            <td style="font-size: 1.1em; color: #28a745;">$ ${totalCobradoHoy.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }
});