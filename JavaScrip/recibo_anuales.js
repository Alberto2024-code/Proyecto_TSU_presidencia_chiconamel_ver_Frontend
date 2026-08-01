document.addEventListener("DOMContentLoaded", () => {
    // 1. Extraer 'cuenta' y 'anio' desde la URL (?cuenta=469&anio=2026)
    const urlParams = new URLSearchParams(window.location.search);
    const cuenta = urlParams.get('cuenta');
    const anio = urlParams.get('anio');

    // Validación
    if (!cuenta || !anio) {
        alert("Error: Faltan datos (cuenta o año) para consultar el recibo anual.");
        return;
    }

    // 2. Cargar los datos del recibo anual
    cargarReciboAnual(cuenta, anio);
});

async function cargarReciboAnual(cuenta, anio) {
    try {
        // Petición a tu endpoint anual en Express
        const response = await fetch(`http://localhost:3000/api/recibo/recibos-anuales/${cuenta}`);
        
        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.statusText}`);
        }

        const data = await response.json();

        // Si la respuesta es un arreglo, buscamos el que coincida con el año (o tomamos el primero)
        let recibo = null;
        if (Array.isArray(data)) {
            recibo = data.find(r => String(r.anio) === String(anio)) || data[0];
        } else {
            recibo = data;
        }

        if (!recibo) {
            alert("No se encontraron registros de recibo anual para este año.");
            return;
        }

        // 3. Renderizar en la plantilla
        renderizarRecibo(recibo);

    } catch (error) {
        console.error("Error al cargar la información del recibo anual:", error);
        document.getElementById("cliente-nombre").textContent = "Error al cargar los datos";
    }
}

function renderizarRecibo(r) {
    // A. Folio (Usa un formato representativo para la constancia anual)
    document.getElementById("recibo-folio").textContent = `ANUAL-${r.anio || '--'}`;

    // B. Procesar Fecha (Si no hay fecha de pago, usamos la fecha de consulta)
    const fecha = r.fecha_pago ? new Date(r.fecha_pago) : new Date();
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const anioActual = fecha.getUTCFullYear();
    
    const meses = [
        "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", 
        "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];
    const mesNombre = meses[fecha.getUTCMonth()];

    document.getElementById("fecha-dia").textContent = dia;
    document.getElementById("fecha-mes").textContent = mesNombre;
    document.getElementById("fecha-anio").textContent = anioActual;

    // C. Datos del Ciudadano y Servicio
    const nombreCompleto = `${r.nombre || ''} ${r.apellido_paterno || ''} ${r.apellido_materno || ''}`.trim();
    document.getElementById("cliente-nombre").textContent = nombreCompleto || "C. CIUDADANO";
    document.getElementById("cliente-domicilio").textContent = r.domicilio || r.comunidad || "CONOCIDO";
    
    // Mostramos los meses consolidados (ej: "ENERO, FEBRERO, MARZO...") o el año
    document.getElementById("recibo-mes-pago").textContent = r.meses_pagados || `TODO EL AÑO ${r.anio}`;
    document.getElementById("cliente-cuenta").textContent = r.cuenta_no || "N/A";

    // D. Formatear Importes
    const formatearMoneda = (valor) => {
        const num = parseFloat(valor) || 0;
        return `$ ${num.toFixed(2)}`;
    };

    // Evaluamos el tipo de servicio
    const tipoServicio = (r.nombre_tipo_servicio || r.tipo_servicio || '').toLowerCase();
    
    let dom = 0, com = 0;
    const totalAnual = parseFloat(r.total_anual_pagado || r.total) || 0;

    if (tipoServicio.includes("comercial")) {
        com = totalAnual;
    } else {
        dom = totalAnual;
    }

    document.getElementById("imp-domestico").textContent = formatearMoneda(dom);
    document.getElementById("imp-comercial").textContent = formatearMoneda(com);
    document.getElementById("imp-contrato").textContent = formatearMoneda(0);
    document.getElementById("imp-tomas").textContent = formatearMoneda(0);
    document.getElementById("imp-rezagos").textContent = formatearMoneda(r.total_rezagos || 0);
    document.getElementById("imp-recargos").textContent = formatearMoneda(r.total_recargos || 0);
    document.getElementById("imp-iva").textContent = formatearMoneda(r.total_iva || 0);
    document.getElementById("imp-descuento").textContent = formatearMoneda(r.total_descuentos || 0);

    // E. Total Anual
    document.getElementById("imp-total").textContent = formatearMoneda(totalAnual);

    // F. Convertir Total a Letras
    document.getElementById("total-letras").textContent = numeroALetras(totalAnual);
}

// // Función de conversión de número a letras
function numeroALetras(numero) {
    const formatoCentavos = `PESOS ${(numero % 1 * 100).toFixed(0).padStart(2, '0')}/100 M.N.`;
    const entero = Math.floor(numero);

    const equivalencias = {
        60: "SESENTA", 120: "CIENTO VEINTE", 180: "CIENTO OCHENTA",
        240: "DOSCIENTOS CUARENTA", 300: "TRESCIENTOS", 360: "TRESCIENTOS SESENTA",
        420: "CUATROCIENTOS VEINTE", 480: "CUATROCIENTOS OCHENTA", 540: "QUINIENTOS CUARENTA",
        600: "SEISCIENTOS", 660: "SEISCIENTOS SESENTA", 720: "SETECIENTOS VEINTE",
        780: "SETECIENTOS OCHENTA", 840: "OCHOCIENTOS CUARENTA", 900: "NOVECIENTOS",
        960: "NOVECIENTOS SESENTA", 1020: "MIL VEINTE"
    };

    if (equivalencias[entero]) {
        return `${equivalencias[entero]} ${formatoCentavos}`;
    }
    
    return `${entero} ${formatoCentavos}`;
}