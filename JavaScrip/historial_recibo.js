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

async function cargarHistorialCompleto(idCiudadano) {
    const contenedorMensual = document.getElementById("contenedor-recibos");
    const contenedorAnual = document.getElementById("contenedor-recibos-por-año");

    let recibosMensuales = [];

    // =========================================================================
    // A. CARGAR RECIBOS MENSUALES INDIVIDUALES (CON RESPALDO EN LOCALHOST)
    // =========================================================================
    const endpointMensual = `/api/recibo/historial/${idCiudadano}`;
    let resMensual;

    try {
        // 💡 1. Primer intento: Usando la IP dinámica del servidor
        resMensual = await fetch(`http://${window.location.hostname}:3000${endpointMensual}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión de mensuales por IP/Red. Intentando por localhost...");
        try {
            // 🔄 2. Segundo intento: Localhost
            resMensual = await fetch(`http://localhost:3000${endpointMensual}`);
        } catch (localError) {
            console.error("❌ Error crítico al conectar con el servidor de recibos mensuales:", localError);
            mostrarMensajeError("No se pudo conectar con el servidor para recuperar el historial de cobros.");
            return;
        }
    }

    try {
        if (!resMensual || !resMensual.ok) throw new Error("Error al obtener recibos mensuales.");
        recibosMensuales = await resMensual.json();

        // Si no tiene recibos registrados
        if (!Array.isArray(recibosMensuales) || recibosMensuales.length === 0) {
            if (contenedorMensual) contenedorMensual.innerHTML = `<p class="msg-vacio" style="grid-column: 1/-1; text-align: center;">Este ciudadano no cuenta con recibos mensuales generados.</p>`;
            if (contenedorAnual) contenedorAnual.innerHTML = `<p class="msg-vacio" style="grid-column: 1/-1; text-align: center;">Sin registros anuales.</p>`;
            return;
        }

        // Renderizar Recibos Mensuales
        if (contenedorMensual) renderizarRecibosMensuales(recibosMensuales, contenedorMensual);

    } catch (error) {
        console.error("❌ Error procesando recibos mensuales:", error);
        mostrarMensajeError("Error al procesar los recibos mensuales.");
        return;
    }

    // =========================================================================
    // B. CARGAR RECIBOS ANUALES CONSOLIDADOS (CON RESPALDO EN LOCALHOST)
    // =========================================================================
    const cuentaNo = recibosMensuales[0]?.cuenta_no || idCiudadano;
    console.log("📌 Número de cuenta detectado:", cuentaNo);

    if (cuentaNo) {
        const endpointAnual = `/api/recibo/recibos-anuales/${cuentaNo}`;
        let resAnual;

        try {
            // 💡 1. Primer intento por IP dinámica
            resAnual = await fetch(`http://${window.location.hostname}:3000${endpointAnual}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión de anuales por IP/Red. Intentando por localhost...");
            try {
                // 🔄 2. Segundo intento por localhost
                resAnual = await fetch(`http://localhost:3000${endpointAnual}`);
            } catch (localError) {
                console.error("Error crítico al obtener recibos anuales:", localError);
            }
        }

        try {
            if (resAnual && resAnual.ok) {
                let recibosAnuales = await resAnual.json();
                console.log("📊 Datos Anuales recibidos:", recibosAnuales);

                // 🔹 Si el backend responde un Objeto único en lugar de Arreglo, lo convertimos a Arreglo
                if (recibosAnuales && !Array.isArray(recibosAnuales)) {
                    recibosAnuales = [recibosAnuales];
                }

                if (contenedorAnual) renderizarRecibosAnuales(recibosAnuales, contenedorAnual);
            } else {
                console.warn("⚠️ La ruta de recibos anuales devolvió un estado no válido.");
                if (contenedorAnual) contenedorAnual.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay resúmenes anuales consolidados para mostrar.</p>`;
            }
        } catch (error) {
            console.error("❌ Error al procesar recibos anuales:", error);
            if (contenedorAnual) contenedorAnual.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay resúmenes anuales consolidados para mostrar.</p>`;
        }
    }
}

// -------------------------------------------------------------
// FUNCIONES DE RENDERIZADO
// -------------------------------------------------------------

function renderizarRecibosMensuales(recibos, contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = "";

    recibos.forEach(recibo => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-recibo");

        const fechaPagoCorta = recibo.fecha_pago ? recibo.fecha_pago.split("T")[0] : "No registrada";

        tarjeta.innerHTML = `
            <div class="contenedor-miniatura" style="font-size: 50px; padding: 5px 0;">📄</div>
            <div class="info-recibo">
                <h3 style="font-size: 15px; margin-bottom: 5px;">RECIBO Nº ${recibo.numero_recibo || '--'}</h3>
                <p style="font-size: 13px; color: #555;"><b>Mes:</b> ${recibo.mes_pagado || 'N/A'}</p>
                <p style="font-size: 13px; color: #555;"><b>Año:</b> ${recibo.anio || '--'}</p>
                <p style="font-size: 13px; color: #555; margin-bottom: 8px;"><b>Fecha:</b> ${fechaPagoCorta}</p>
                <p style="font-size: 16px; font-weight: bold; color: #1B4332; margin-bottom: 12px;">$${parseFloat(recibo.total || 0).toFixed(2)}</p>
                
                <a href="../html/resivo.html?id=${recibo.id_recibo}" target="_blank" class="btn-descargar">
                    Ver / Imprimir
                </a>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function renderizarRecibosAnuales(recibosAnuales, contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (!Array.isArray(recibosAnuales) || recibosAnuales.length === 0) {
        contenedor.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay resúmenes anuales consolidados para mostrar.</p>`;
        return;
    }

    recibosAnuales.forEach(recibo => {
        const tarjeta = document.createElement("div");
        tarjeta.classList.add("tarjeta-recibo", "tarjeta-anual");

        // 1. Obtener la cantidad de meses pagados
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
        const subtotalServicio = 54.00 * numMeses; 
        const adicionalTotal = 6.00 * numMeses;    
        const rezagos = parseFloat(recibo.total_rezagos || recibo.rezagos || 0); 
        const recargos = parseFloat(recibo.total_recargos || recibo.recargos || 0);
        const contrato = parseFloat(recibo.contrato || 0);
        const descuento = parseFloat(recibo.total_descuentos || recibo.descuentos || 0);

        // Suma final real
        const totalRealAnual = Math.max(0, (subtotalServicio + adicionalTotal + rezagos + recargos + contrato) - descuento);

        tarjeta.innerHTML = `
            <div class="contenedor-miniatura" style="font-size: 50px; padding: 5px 0;">🗂️</div>
            <div class="info-recibo">
                <h3 style="font-size: 16px; color: #1B4332; margin-bottom: 5px;">AÑO ${recibo.anio || '--'}</h3>
                <p style="font-size: 12px; color: #333; margin-bottom: 5px; font-weight: 500;">
                    <b>Meses:</b> ${textoMeses || 'N/A'}
                </p>
                <p style="font-size: 13px; color: #555; margin-bottom: 8px;">
                    <b>Total Meses:</b> ${numMeses}
                </p>
                <p style="font-size: 18px; font-weight: bold; color: #2D6A4F; margin-bottom: 12px;">
                    $${totalRealAnual.toFixed(2)}
                </p>
                
                <a href="../html/recibos_anuales.html?cuenta=${recibo.cuenta_no || recibo.cuenta}&anio=${recibo.anio}" target="_blank" class="btn-descargar">
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