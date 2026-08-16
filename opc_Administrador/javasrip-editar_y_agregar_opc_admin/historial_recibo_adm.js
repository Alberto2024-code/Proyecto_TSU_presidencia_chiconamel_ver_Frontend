document.addEventListener("DOMContentLoaded", () => {
    // 1. Extraer el ID del ciudadano desde la URL (?id=X)
    const urlParams = new URLSearchParams(window.location.search);
    const idCiudadano = urlParams.get('id');

    // Validación si se ingresa sin ID
    if (!idCiudadano) {
        mostrarMensajeError("Error: No se proporcionó el identificador del ciudadano.");
        return;
    }

    // 2. Cargar tanto los recibos mensuales como la consolidación por año
    cargarHistorialCompleto(idCiudadano);
});

// =========================================================================
// CARGAR HISTORIAL COMPLETO (CON RESPALDO EN LOCALHOST)
// =========================================================================
async function cargarHistorialCompleto(idCiudadano) {
    const contenedorMensual = document.getElementById("contenedor-recibos");
    const contenedorAnual = document.getElementById("contenedor-recibos-por-año");

    try {
        // -----------------------------------------------------------------
        // A. Cargar Recibos Mensuales Individuales
        // -----------------------------------------------------------------
        const endpointMensual = `/api/recibo/historial/${idCiudadano}`;
        let resMensual;

        try {
            // 💡 1. Primer intento: IP/Host dinámico según el navegador
            resMensual = await fetch(`http://${window.location.hostname}:3000${endpointMensual}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
            resMensual = await fetch(`http://localhost:3000${endpointMensual}`);
        }

        if (!resMensual || !resMensual.ok) {
            throw new Error("Error al obtener recibos mensuales.");
        }
        
        const recibosMensuales = await resMensual.json();

        // Si no tiene recibos registrados
        if (!recibosMensuales || recibosMensuales.length === 0) {
            contenedorMensual.innerHTML = `<p class="msg-vacio" style="grid-column: 1/-1; text-align: center;">Este ciudadano no cuenta con recibos mensuales generados.</p>`;
            contenedorAnual.innerHTML = `<p class="msg-vacio" style="grid-column: 1/-1; text-align: center;">Sin registros anuales.</p>`;
            return;
        }

        // Renderizar Recibos Mensuales
        renderizarRecibosMensuales(recibosMensuales, contenedorMensual);

        // -----------------------------------------------------------------
        // B. Extraer 'cuenta_no' del primer recibo (o usar idCiudadano como respaldo)
        // -----------------------------------------------------------------
        const cuentaNo = recibosMensuales[0].cuenta_no || idCiudadano;
        console.log("📌 Número de cuenta detectado:", cuentaNo);

        if (cuentaNo) {
            // -------------------------------------------------------------
            // C. Cargar Recibos Anuales Consolidados
            // -------------------------------------------------------------
            const endpointAnual = `/api/recibo/recibos-anuales/${cuentaNo}`;
            let resAnual;

            try {
                // 💡 1. Primer intento: IP/Host dinámico
                resAnual = await fetch(`http://${window.location.hostname}:3000${endpointAnual}`);
            } catch (netErrorAnual) {
                console.warn("⚠️ Falló la conexión anual por IP. Intentando conexión local...");
                try {
                    // 🔄 2. Segundo intento: localhost
                    resAnual = await fetch(`http://localhost:3000${endpointAnual}`);
                } catch (localErrorAnual) {
                    console.error("❌ Fallaron ambas vías de conexión anual:", localErrorAnual);
                }
            }
            
            if (resAnual && resAnual.ok) {
                let recibosAnuales = await resAnual.json();
                console.log("📊 Datos Anuales recibidos:", recibosAnuales);

                // 🔹 Si el backend responde un Objeto único en lugar de Arreglo, lo convertimos a Arreglo
                if (recibosAnuales && !Array.isArray(recibosAnuales)) {
                    recibosAnuales = [recibosAnuales];
                }

                renderizarRecibosAnuales(recibosAnuales, contenedorAnual);
            } else {
                console.warn("⚠️ La ruta de recibos anuales devolvió error HTTP:", resAnual ? resAnual.status : 'Sin Respuesta');
                contenedorAnual.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay resúmenes anuales consolidados para mostrar.</p>`;
            }
        }

    } catch (error) {
        console.error("❌ Error en cargarHistorialCompleto:", error);
        mostrarMensajeError("No se pudo conectar con el servidor para recuperar el historial de cobros.");
    }
}

// -------------------------------------------------------------
// FUNCIONES DE RENDERIZADO
// -------------------------------------------------------------

function renderizarRecibosMensuales(recibos, contenedor) {
    contenedor.innerHTML = "";

    recibos.forEach(recibo => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-recibo");

        const fechaPagoCorta = recibo.fecha_pago ? recibo.fecha_pago.split("T")[0] : "No registrada";

        tarjeta.innerHTML = `
            <div class="contenedor-miniatura" style="font-size: 50px; padding: 5px 0;">📄</div>
            <div class="info-recibo">
                <h3 style="font-size: 15px; margin-bottom: 5px;">RECIBO Nº ${recibo.numero_recibo}</h3>
                <p style="font-size: 13px; color: #555;"><b>Mes:</b> ${recibo.mes_pagado || 'N/A'}</p>
                <p style="font-size: 13px; color: #555;"><b>Año:</b> ${recibo.anio}</p>
                <p style="font-size: 13px; color: #555; margin-bottom: 8px;"><b>Fecha:</b> ${fechaPagoCorta}</p>
                <p style="font-size: 16px; font-weight: bold; color: #1B4332; margin-bottom: 12px;">$${parseFloat(recibo.total || 0).toFixed(2)}</p>
                
                <a href="../opc_Administrador/resivo_adm.html?id=${recibo.id_recibo}" target="_blank" class="btn-descargar">
                    Ver / Imprimir
                </a>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function renderizarRecibosAnuales(recibosAnuales, contenedor) {
    contenedor.innerHTML = "";

    if (!recibosAnuales || recibosAnuales.length === 0) {
        contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay resúmenes anuales consolidados para mostrar.</p>`;
        return;
    }

    recibosAnuales.forEach(recibo => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-recibo", "tarjeta-anual");

        // 1. Obtener la cantidad de meses pagados (ej: "OCTUBRE, NOVIEMBRE" = 2)
        const textoMeses = recibo.meses_pagados || recibo.meses || '';
        let numMeses = parseInt(recibo.total_meses_pagados) || 1;
        
        if (typeof textoMeses === 'string' && textoMeses.includes(',')) {
            numMeses = textoMeses.split(',').map(m => m.trim()).filter(Boolean).length;
        } else if (Array.isArray(textoMeses)) {
            numMeses = textoMeses.length;
        } else if (recibo.es_pago_anual === 1 || String(textoMeses).toLowerCase().includes('todo')) {
            numMeses = 12;
        }

        // 2. Cálculo real exacto de la tarifa
        const subtotalServicio = 54.00 * numMeses;  // 2 meses x $54 = $108.00
        const adicionalTotal = 6.00 * numMeses;    // 2 meses x $6 = $12.00
        const rezagos = parseFloat(recibo.total_rezagos || recibo.rezagos || 0); // $8.00
        const recargos = parseFloat(recibo.total_recargos || recibo.recargos || 0);
        const contrato = parseFloat(recibo.contrato || 0);
        const descuento = parseFloat(recibo.total_descuentos || recibo.descuentos || 0);

        // 🎯 Suma final real ($108 + $12 + $8 = $128.00)
        const totalRealAnual = Math.max(0, (subtotalServicio + adicionalTotal + rezagos + recargos + contrato) - descuento);

        tarjeta.innerHTML = `
            <div class="contenedor-miniatura" style="font-size: 50px; padding: 5px 0;">🗂️</div>
            <div class="info-recibo">
                <h3 style="font-size: 16px; color: #1B4332; margin-bottom: 5px;">AÑO ${recibo.anio}</h3>
                <p style="font-size: 12px; color: #333; margin-bottom: 5px; font-weight: 500;">
                    <b>Meses:</b> ${textoMeses}
                </p>
                <p style="font-size: 13px; color: #555; margin-bottom: 8px;">
                    <b>Total Meses:</b> ${numMeses}
                </p>
                <p style="font-size: 18px; font-weight: bold; color: #2D6A4F; margin-bottom: 12px;">
                    $${totalRealAnual.toFixed(2)}
                </p>
                
                <a href="../opc_Administrador/recibos_anuales_adm.html?cuenta=${recibo.cuenta_no || recibo.cuenta}&anio=${recibo.anio}" target="_blank" class="btn-descargar">
                    Ver / Imprimir
                </a>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function mostrarMensajeError(mensaje) {
    const contenedor = document.getElementById("contenedor-recibos");
    if (contenedor) {
        contenedor.innerHTML = `<p style="grid-column: 1/-1; color: red; font-weight: bold; text-align: center;">${mensaje}</p>`;
    }
}