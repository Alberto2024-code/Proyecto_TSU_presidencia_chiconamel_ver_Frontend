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
    const endpointRecibo = `/api/recibo/recibos-anuales/${cuenta}`;
    let response;

    try {
        // 💡 1. Primer intento: IP dinámica actual
        response = await fetch(`http://${window.location.hostname}:3000${endpointRecibo}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        try {
            // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
            response = await fetch(`http://localhost:3000${endpointRecibo}`);
        } catch (localError) {
            console.error("❌ Error crítico al cargar la información del recibo anual:", localError);
            document.getElementById("cliente-nombre").textContent = "Error de conexión con el servidor";
            alert("No se pudo establecer conexión con el servidor backend (Puerto 3000).");
            return;
        }
    }

    try {
        if (!response || !response.ok) {
            throw new Error(`Error en la petición: ${response ? response.statusText : 'Sin respuesta'}`);
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
        console.error("Error al procesar los datos del recibo anual:", error);
        document.getElementById("cliente-nombre").textContent = "Error al cargar los datos";
    }
}

function renderizarRecibo(r) {
    // A. Folio
    document.getElementById("recibo-folio").textContent = `ANUAL-${r.anio || '--'}`;

    // B. Procesar Fecha
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
    document.getElementById("cliente-domicilio").textContent = `${r.domicilio || ''} ${r.comunidad || ''}`.trim();
    
    const textoMeses = r.meses_pagados || r.meses || `TODO EL AÑO ${r.anio}`;
    document.getElementById("recibo-mes-pago").textContent = textoMeses;
    document.getElementById("cliente-cuenta").textContent = r.cuenta_no || r.cuenta || "N/A";

    // D. Calcular número de meses pagados (Ej: "OCTUBRE, NOVIEMBRE" = 2)
    let numMeses = 1;
    if (typeof textoMeses === 'string' && textoMeses.includes(',')) {
        numMeses = textoMeses.split(',').map(m => m.trim()).filter(Boolean).length;
    } else if (Array.isArray(textoMeses)) {
        numMeses = textoMeses.length;
    } else if (r.es_pago_anual === 1 || String(textoMeses).toLowerCase().includes('todo')) {
        numMeses = 12;
    }

    // E. Cuotas fijas base por mes
    const tarifaBasePura = 54.00; // Cuota doméstica ($54/mes)
    const adicionalUnitario = 6.00; // Adicional ($6/mes)

    // F. Multiplicar por cantidad de meses
    const tipoServicio = String(r.nombre_tipo_servicio || r.tipo_servicio || '').toLowerCase();
    const esComercial = tipoServicio.includes("comercial") || tipoServicio === '2';

    const subtotalServicio = tarifaBasePura * numMeses; // 2 x $54 = $108.00
    const adicionalTotal = adicionalUnitario * numMeses; // 2 x $6 = $12.00

    // Conceptos únicos traídos de BD
    const contrato = parseFloat(r.contrato || 0);
    const tomas = parseInt(r.tomas_agua || r.tomas || 1);
    const rezagos = parseFloat(r.total_rezagos || r.rezagos || 0);
    const recargos = parseFloat(r.total_recargos || r.recargos || 0);
    const descuento = parseFloat(r.total_descuentos || r.descuentos || 0);

    const formatearMoneda = (valor) => `$ ${(parseFloat(valor) || 0).toFixed(2)}`;

    // G. Pintar en los elementos HTML
    document.getElementById("imp-domestico").textContent = formatearMoneda(esComercial ? 0 : subtotalServicio);
    document.getElementById("imp-comercial").textContent = formatearMoneda(esComercial ? subtotalServicio : 0);
    document.getElementById("imp-contrato").textContent = formatearMoneda(contrato);
    document.getElementById("imp-tomas").textContent = tomas;
    document.getElementById("imp-rezagos").textContent = formatearMoneda(rezagos);
    document.getElementById("imp-recargos").textContent = formatearMoneda(recargos);
    document.getElementById("imp-iva").textContent = formatearMoneda(adicionalTotal);
    document.getElementById("imp-descuento").textContent = formatearMoneda(descuento);

    // H. Suma matemática exacta: $108.00 + $12.00 + $8.00 = $128.00
    const totalSumaReal = Math.max(0, (subtotalServicio + contrato + rezagos + recargos + adicionalTotal) - descuento);

    // I. Colocar el Total y la conversión en Letras
    document.getElementById("imp-total").textContent = formatearMoneda(totalSumaReal);
    document.getElementById("total-letras").textContent = numeroALetras(totalSumaReal);
}

// Función auxiliar para convertir números a letras
function numeroALetras(num) {
    if (num <= 0) return 'CERO PESOS 00/100 M.N.';
    const Unidades = num => ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'][num];
    const Decenas = num => ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'][num];
    const DiezAVeinte = num => ['DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECINUEVE'][num - 10];
    
    let enteros = Math.floor(num);
    let centavos = Math.round((num - enteros) * 100);
    let letras = '';

    if (enteros === 0) letras = 'CERO';
    else if (enteros < 10) letras = Unidades(enteros);
    else if (enteros < 20) letras = DiezAVeinte(enteros);
    else if (enteros < 100) {
        let u = enteros % 10;
        let d = Math.floor(enteros / 10);
        letras = d === 2 && u > 0 ? `VEINTI${Unidades(u)}` : `${Decenas(d)}${u > 0 ? ' Y ' + Unidades(u) : ''}`;
    } else if (enteros < 1000) {
        let d_u = enteros % 100;
        let c = Math.floor(enteros / 100);
        let textoCentena = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'][c];
        if (c === 1 && d_u === 0) textoCentena = 'CIEN';
        letras = `${textoCentena} ${numeroALetras(d_u).split(' PESOS')[0]}`;
    } else {
        letras = `${enteros}`;
    }

    return `${letras.trim()} PESOS ${String(centavos).padStart(2, '0')}/100 M.N.`.toUpperCase();
}