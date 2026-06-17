// 1. Función para pintar los datos directamente de la base de datos en el HTML
function cargarDatosRecibo(recibo) {
    if (!recibo) return;

    // Concatenar el nombre completo del ciudadano usando los campos de la API
    const nombreCompleto = `${recibo.nombre || ''} ${recibo.apellido_paterno || ''} ${recibo.apellido_materno || ''}`.trim();
    
    // Procesar la fecha de registro para extraer Día, Mes y Año
    let dia = "--", mes = "--", anio = "--";
    if (recibo.fecha_registro) {
        const fecha = new Date(recibo.fecha_registro);
        dia = String(fecha.getDate()).padStart(2, '0');
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        mes = meses[fecha.getMonth()];
        anio = String(fecha.getFullYear()).slice(-2); // Toma los últimos 2 dígitos (ej: 26)
    }

    // Inyectar datos generales en el encabezado y cliente
    document.getElementById('recibo-folio').innerText = `No. ${recibo.numero_recibo || '--'}`;
    document.getElementById('fecha-dia').innerText = dia;
    document.getElementById('fecha-mes').innerText = mes;
    document.getElementById('fecha-anio').innerText = anio;
    
    document.getElementById('cliente-nombre').innerText = nombreCompleto || 'CONOCIDO';
    document.getElementById('cliente-domicilio').innerText = recibo.domicilio ? recibo.domicilio.trim() : 'CONOCIDO';
    document.getElementById('recibo-mes-pago').innerText = recibo.mes_pagado ? recibo.mes_pagado.toUpperCase() : mes.toUpperCase();
    document.getElementById('cliente-cuenta').innerText = recibo.cuenta_no || 'S/N';

    // Parsear los montos monetarios que vienen como texto ("60.00") a números decimales
    const domestico = parseFloat(recibo.servicio_domestico) || 0;
    const comercial = parseFloat(recibo.servicio_comercial) || 0;
    const contrato = parseFloat(recibo.contrato) || 0;
    const tomas = parseFloat(recibo.tomas_agua) || 0;
    const rezagos = parseFloat(recibo.rezagos) || 0;
    const recargos = parseFloat(recibo.recargos) || 0;
    const iva = parseFloat(recibo.iva) || 0;
    const descuentos = parseFloat(recibo.descuentos) || 0;
    const total = parseFloat(recibo.total) || 0;

    // Colocar los montos formateados en la tabla de costos
    document.getElementById('imp-domestico').innerText = `$ ${domestico.toFixed(2)}`;
    document.getElementById('imp-comercial').innerText = `$ ${comercial.toFixed(2)}`;
    document.getElementById('imp-contrato').innerText = `$ ${contrato.toFixed(2)}`;
    document.getElementById('imp-tomas').innerText = `$ ${tomas.toFixed(2)}`;
    document.getElementById('imp-rezagos').innerText = `$ ${rezagos.toFixed(2)}`;
    document.getElementById('imp-recargos').innerText = `$ ${recargos.toFixed(2)}`;
    document.getElementById('imp-iva').innerText = `$ ${iva.toFixed(2)}`;
    document.getElementById('imp-descuento').innerText = `$ ${descuentos.toFixed(2)}`;
    
    document.getElementById('imp-total').innerText = `$ ${total.toFixed(2)}`;
    
    // Asignar el importe con letra que viene directo del backend
    document.getElementById('total-letras').innerText = recibo.importe_letra ? `${recibo.importe_letra.toUpperCase()} 00/100 M.N.` : "CERO PESOS 00/100 M.N.";
}

// 2. Evento que se ejecuta al cargar la página en el navegador
window.addEventListener('DOMContentLoaded', () => {
    // URL de tu API local que acabas de terminar
    const url = 'http://localhost:3000/api/recibo/';

    // Llamar a tu API mediante un fetch
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al conectar con la API de recibos');
            return response.json();
        })
        .then(data => {
            // Como tu respuesta es un Array [ { ... } ], tomamos el primer recibo disponible
            if (Array.isArray(data) && data.length > 0) {
                cargarDatosRecibo(data[0]);
            } else {
                document.getElementById('cliente-nombre').innerText = 'No se encontraron recibos vigentes';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('cliente-nombre').innerText = 'Error de servidor al cargar el recibo';
        });
});