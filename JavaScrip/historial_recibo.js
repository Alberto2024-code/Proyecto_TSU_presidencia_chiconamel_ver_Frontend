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

    try {
        // A. Cargar Recibos Mensuales Individuales
        const resMensual = await fetch(`http://localhost:3000/api/recibo/historial/${idCiudadano}`);
        
        if (!resMensual.ok) throw new Error("Error al obtener recibos mensuales.");
        const recibosMensuales = await resMensual.json();

        // Si no tiene recibos registrados
        if (!recibosMensuales || recibosMensuales.length === 0) {
            contenedorMensual.innerHTML = `<p class="msg-vacio" style="grid-column: 1/-1; text-align: center;">Este ciudadano no cuenta con recibos mensuales generados.</p>`;
            contenedorAnual.innerHTML = `<p class="msg-vacio" style="grid-column: 1/-1; text-align: center;">Sin registros anuales.</p>`;
            return;
        }

        // Renderizar Recibos Mensuales
        renderizarRecibosMensuales(recibosMensuales, contenedorMensual);

        // B. Extraer 'cuenta_no' del primer recibo (o usar idCiudadano como respaldo)
        const cuentaNo = recibosMensuales[0].cuenta_no || idCiudadano;
        console.log("📌 Número de cuenta detectado:", cuentaNo);

        if (cuentaNo) {
            // C. Cargar Recibos Anuales Consolidados (Consulta TODOS los años de esa cuenta)
            const URL_ANUAL = `http://localhost:3000/api/recibo/recibos-anuales/${cuentaNo}`;
            
            const resAnual = await fetch(URL_ANUAL);
            
            if (resAnual.ok) {
                let recibosAnuales = await resAnual.json();
                console.log("📊 Datos Anuales recibidos:", recibosAnuales);

                // 🔹 Si el backend responde un Objeto único en lugar de Arreglo, lo convertimos a Arreglo
                if (recibosAnuales && !Array.isArray(recibosAnuales)) {
                    recibosAnuales = [recibosAnuales];
                }

                renderizarRecibosAnuales(recibosAnuales, contenedorAnual);
            } else {
                console.warn("⚠️ La ruta de recibos anuales devolvió error HTTP:", resAnual.status);
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
                <p style="font-size: 16px; font-weight: bold; color: #1B4332; margin-bottom: 12px;">$${recibo.total}</p>
                
                <a href="../html/resivo.html?id=${recibo.id_recibo}" target="_blank" class="btn-descargar">
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

        tarjeta.innerHTML = `
            <div class="contenedor-miniatura" style="font-size: 50px; padding: 5px 0;">🗂️</div>
            <div class="info-recibo">
                <h3 style="font-size: 16px; color: #1B4332; margin-bottom: 5px;">AÑO ${recibo.anio}</h3>
                <p style="font-size: 12px; color: #333; margin-bottom: 5px; font-weight: 500;">
                    <b>Meses:</b> ${recibo.meses_pagados}
                </p>
                <p style="font-size: 13px; color: #555; margin-bottom: 8px;">
                    <b>Total Meses:</b> ${recibo.total_meses_pagados}
                </p>
                <p style="font-size: 18px; font-weight: bold; color: #2D6A4F; margin-bottom: 12px;">
                    $${recibo.total_anual_pagado}
                </p>
                
                <a href="../html/recibos_anuales.html?cuenta=${recibo.cuenta_no}&anio=${recibo.anio}" target="_blank" class="btn-descargar">
                    Ver / Imprimir
                </a>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function mostrarMensajeError(mensaje) {
    const contenedor = document.getElementById("contenedor-recibos");
    contenedor.innerHTML = `<p style="grid-column: 1/-1; color: red; font-weight: bold; text-align: center;">${mensaje}</p>`;
}