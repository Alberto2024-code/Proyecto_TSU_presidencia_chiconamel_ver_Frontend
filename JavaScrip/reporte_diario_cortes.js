document.addEventListener('DOMContentLoaded', () => {
    let cobrosDelDiaGlobal = [];

    const inputBuscador = document.getElementById('buscar-rezagado');
    const tbody = document.getElementById('tabla-rezagados');

    // 1. Cargar el reporte de corte diario al iniciar
    cargarReporteDiario();

    // 2. Escuchar el evento de búsqueda en tiempo real
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            const busqueda = e.target.value.toLowerCase().trim();
            const filtrados = cobrosDelDiaGlobal.filter(item => {
                const nombreCompleto = `${item.nombre || ''} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`.toLowerCase();
                const cuenta = String(item.cuenta_no || item.cuenta || '').toLowerCase();
                const mes = String(item.mes_pagado || '').toLowerCase();
                return nombreCompleto.includes(busqueda) || cuenta.includes(busqueda) || mes.includes(busqueda);
            });
            renderizarTabla(filtrados);
        });
    }

    // =========================================================================
    // CARGAR REPORTE DIARIO (CON RESPALDO EN LOCALHOST)
    // =========================================================================
    async function cargarReporteDiario() {
        const endpointCorte = '/api/recibo/corte-diario';
        let response;

        try {
            // 💡 1. Primer intento: IP dinámica actual
            response = await fetch(`http://${window.location.hostname}:3000${endpointCorte}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpointCorte}`);
            } catch (localError) {
                console.error('❌ Error crítico al consultar el corte diario:', localError);
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="11" style="text-align: center; color: red; font-weight: bold; padding: 15px;">
                                Ocurrió un error al cargar la información del reporte diario.
                            </td>
                        </tr>
                    `;
                }
                return;
            }
        }

        try {
            if (!response || !response.ok) {
                throw new Error('Error al consultar el servidor');
            }

            const data = await response.json();
            const listaRecibos = Array.isArray(data) ? data : (data.recibos || data.data || []);

            console.log("📥 Datos recibidos del reporte diario:", listaRecibos);

            if (listaRecibos.length === 0) {
                renderizarTabla([]);
                return;
            }

            const hoy = new Date();
            const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

            // Filtrar cobros pertenecientes a la fecha de hoy
            let recibosFiltrados = listaRecibos.filter(item => {
                if (!item.fecha_pago && !item.fecha_registro) return false;
                
                const fechaRaw = item.fecha_pago || item.fecha_registro;
                const fechaStr = String(fechaRaw).slice(0, 10); // Toma "YYYY-MM-DD"
                
                const esPagado = !item.estado_recibo || String(item.estado_recibo).toLowerCase() === 'pagado';
                return fechaStr === hoyISO && esPagado;
            });

            // 💡 Respaldos: Si hoy no se han registrado cobros, muestra la última fecha con actividad registrada
            if (recibosFiltrados.length === 0 && listaRecibos.length > 0) {
                console.warn("⚠️ No se encontraron cobros registrados con la fecha de hoy. Mostrando la jornada más reciente.");
                
                const ultimaFecha = String(listaRecibos[0].fecha_pago || listaRecibos[0].fecha_registro || '').slice(0, 10);
                
                recibosFiltrados = listaRecibos.filter(item => {
                    const fechaRaw = item.fecha_pago || item.fecha_registro;
                    return String(fechaRaw).slice(0, 10) === ultimaFecha;
                });
            }

            cobrosDelDiaGlobal = recibosFiltrados;
            renderizarTabla(cobrosDelDiaGlobal);

        } catch (error) {
            console.error('❌ Error al procesar el reporte diario:', error);
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="11" style="text-align: center; color: red; font-weight: bold; padding: 15px;">
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
                    <td colspan="11" style="text-align: center; font-style: italic; color: #666; padding: 15px;">
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
            const campoFecha = item.fecha_pago || item.fecha_registro;
            if (campoFecha) {
                const partes = String(campoFecha).slice(0, 10).split('-');
                if (partes.length === 3) {
                    fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }

            // Identificar tipo de servicio
            const servicioTexto = String(item.nombre_servicio || item.tipo_servicio || '').toLowerCase();
            const esDomestico = servicioTexto.includes('domestico') || item.tipo_servicio == 1;

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
                <td>${esDomestico ? 'DOMÉSTICO' : 'COMERCIAL'}</td>
                <td>${(item.mes_pagado || '').toUpperCase()}</td>
                <td><strong>$ ${monto.toFixed(2)}</strong></td>
            `;
            tbody.appendChild(tr);
        });

        // Fila de Total de la Jornada
        const trTotal = document.createElement('tr');
        trTotal.style.backgroundColor = '#e9ecef';
        trTotal.style.fontWeight = 'bold';
        trTotal.innerHTML = `
            <td colspan="10" style="text-align: right; font-size: 1.1em; padding: 10px;">TOTAL COBRADO:</td>
            <td style="font-size: 1.1em; color: #28a745; padding: 10px;">$ ${totalCobradoHoy.toFixed(2)}</td>
        `;
        tbody.appendChild(trTotal);
    }
});