document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener el ID del recibo desde la URL (?id=206 o ?id_recibo=206)
    const urlParams = new URLSearchParams(window.location.search);
    const idRecibo = urlParams.get('id') || urlParams.get('id_recibo');

    if (!idRecibo) {
        console.error("❌ No se encontró ningún ID de recibo en la URL");
        return;
    }

    obtenerDatosRecibo(idRecibo);
});

// =========================================================================
// OBTENER DATOS DEL RECIBO (CON RESPALDO EN LOCALHOST)
// =========================================================================
async function obtenerDatosRecibo(id) {
    const endpointGet = `/api/recibo/get/${id}`;
    let respuesta;

    try {
        // 💡 1. Primer intento: IP dinámica actual
        respuesta = await fetch(`http://${window.location.hostname}:3000${endpointGet}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        try {
            // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
            respuesta = await fetch(`http://localhost:3000${endpointGet}`);
        } catch (localError) {
            console.error("❌ Error crítico al consultar el recibo:", localError);
            alert("Error crítico de conexión. Verifica que el servidor backend de Node.js esté activo.");
            return;
        }
    }

    try {
        if (!respuesta || !respuesta.ok) {
            throw new Error("No se pudo obtener la respuesta del servidor");
        }

        const respuestaJson = await respuesta.json();

        // Extraer el objeto si la API responde dentro de un Arreglo [ { ... } ]
        const recibo = Array.isArray(respuestaJson) ? respuestaJson[0] : respuestaJson;

        if (!recibo) {
            alert("No se encontraron los datos de este recibo");
            return;
        }

        console.log("📄 Datos del recibo cargado:", recibo);

        // =================================================================
        // 3. RENDERIZAR DATOS DE CABECERA Y CIUDADANO
        // =================================================================
        
        // Folio
        const elFolio = document.getElementById("recibo-folio");
        if (elFolio) elFolio.innerText = `No. ${recibo.numero_recibo || recibo.id_recibo || '--'}`;

        // Nombre del Cliente
        const elNombre = document.getElementById('cliente-nombre');
        if (elNombre) {
            const nombreCompleto = `${recibo.nombre || ''} ${recibo.apellido_paterno || ''} ${recibo.apellido_materno || ''}`.trim();
            elNombre.textContent = (nombreCompleto || 'CIUDADANO REGISTRADO').toUpperCase();
        }

        // Domicilio y Comunidad
        const elDomicilio = document.getElementById("cliente-domicilio");
        if (elDomicilio) {
            const comunidadText = recibo.nombre_comunidad || recibo.comunidad || '';
            const domTexto = `${recibo.domicilio || 'CONOCIDO'}${comunidadText ? ' , ' + comunidadText : ''}`;
            elDomicilio.textContent = domTexto.toUpperCase();
        }

        // Número de Cuenta
        const elCuenta = document.getElementById("cliente-cuenta");
        if (elCuenta) elCuenta.innerText = recibo.cuenta_no || '--';

        // Mes/Año del Comprobante
        const elMesPago = document.getElementById("recibo-mes-pago");
        if (elMesPago) {
            const mesLimpio = recibo.mes_pagado ? recibo.mes_pagado.split("T")[0] : 'JULIO';
            elMesPago.innerText = `${mesLimpio.toUpperCase()} DE ${recibo.anio || '2026'}`;
        }

        // Importe en Letras
        const elLetras = document.getElementById("total-letras");
        if (elLetras) elLetras.innerText = recibo.importe_letra || "CERO PESOS 00/100 M.N.";

        // =================================================================
        // 🎯 4. CÁLCULOS Y CONCEPTOS DEL RECIBO (REZAGOS Y RECARGOS EN CERO)
        // =================================================================
        
        const ivaAdicional = parseFloat(recibo.iva || 0);
        const contrato = parseFloat(recibo.contrato || 0);
        const descuento = parseFloat(recibo.descuentos || 0);
        
        // FORZAMOS REZAGOS Y RECARGOS A CERO
        const rezagosFijos = 0;
        const recargosFijos = 0;

        // Tarifa pura según el tipo de servicio
        const servicioStr = String(recibo.nombre_servicio || recibo.tipo_servicio || '').toLowerCase();
        const esComercial = servicioStr.includes("comercial") || recibo.tipo_servicio == 2;
        
        // Si recibo.total viene con rezagos de BD, calculamos la cuota base pura de 1 mes (ej. $54.00)
        let cuotaBasePura = parseFloat(recibo.total || 0) - ivaAdicional;
        // Si al restar los rezagos antiguos quedaba $57, ajustamos si es doméstica base ($54)
        if (!esComercial && cuotaBasePura === 57) {
            cuotaBasePura = 54.00;
        }

        // Asignación en tabla según servicio
        if (esComercial) {
            document.getElementById("imp-domestico").innerText = "$ 0.00";
            document.getElementById("imp-comercial").innerText = `$ ${cuotaBasePura.toFixed(2)}`;
        } else {
            document.getElementById("imp-domestico").innerText = `$ ${cuotaBasePura.toFixed(2)}`;
            document.getElementById("imp-comercial").innerText = "$ 0.00";
        }

        // Contrato y Tomas
        document.getElementById("imp-contrato").innerText = `$ ${contrato.toFixed(2)}`;
        
        const elTomas = document.getElementById("imp-tomas");
        if (elTomas) elTomas.innerText = `${recibo.tomas_agua || '1.00'}`;

        // 🟢 AHORA SE MUESTRAN SIEMPRE EN $ 0.00
        document.getElementById("imp-rezagos").innerText = "$ 0.00";
        document.getElementById("imp-recargos").innerText = "$ 0.00";
        
        // Adicional y Descuento
        document.getElementById("imp-iva").innerText = `$ ${ivaAdicional.toFixed(2)}`; 
        document.getElementById("imp-descuento").innerText = `$ ${descuento.toFixed(2)}`;
        
        // Recalcular Total Exacto sin rezagos
        const totalCalculado = (cuotaBasePura + contrato + ivaAdicional + rezagosFijos + recargosFijos) - descuento;
        document.getElementById("imp-total").innerText = `$ ${totalCalculado.toFixed(2)}`;

        // =================================================================
        // 5. FECHA SUPERIOR DE EMISIÓN
        // =================================================================
        if (recibo.fecha_pago) {
            const partesFecha = recibo.fecha_pago.split("T")[0].split("-"); 
            const anioCorto = partesFecha[0].substring(2); 
            const mesNumero = partesFecha[1];
            const dia = partesFecha[2];

            const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const nombreMes = meses[parseInt(mesNumero) - 1] || mesNumero;

            if (document.getElementById("fecha-dia")) document.getElementById("fecha-dia").innerText = dia;
            if (document.getElementById("fecha-mes")) document.getElementById("fecha-mes").innerText = nombreMes;
            if (document.getElementById("fecha-anio")) document.getElementById("fecha-anio").innerText = anioCorto;
        }

    } catch (error) {
        console.error("❌ Error al renderizar los datos del recibo:", error);
    }
}