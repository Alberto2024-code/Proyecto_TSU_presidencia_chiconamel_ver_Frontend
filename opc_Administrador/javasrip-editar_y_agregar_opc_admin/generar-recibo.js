document.addEventListener('DOMContentLoaded', async () => {
    // 1. Extraemos el ID del ciudadano de la URL (?edit=82 o ?id=82)
    const urlParams = new URLSearchParams(window.location.search);
    const ciudadanoId = urlParams.get('edit') || urlParams.get('id');

    if (!ciudadanoId) {
        alert('Error: No se detectó un ID de ciudadano en la URL para generar el recibo.');
        return;
    }

    // 2. Cargamos la fecha actual en los campos correspondientes del recibo impreso
    const fecha = new Date();
    document.getElementById('fecha-dia').textContent = String(fecha.getDate()).padStart(2, '0');
    
    const mesesAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById('fecha-mes').textContent = mesesAnio[fecha.getMonth()];
    document.getElementById('fecha-anio').textContent = String(fecha.getFullYear()).slice(-2); // Muestra los últimos 2 dígitos (ej: 26)

    // 3. Consultamos el endpoint para traer los datos cruzados del ciudadano y sus tarifas
    await cargarDatosDelRecibo(ciudadanoId);
});

// Guardamos una variable global para usarla al insertar en la base de datos
let datosCivilGlobal = null;

async function cargarDatosDelRecibo(id) {
    try {
        // Ajusta la URL según la estructura de tus rutas del backend
        const response = await fetch(`http://localhost:3000/api/recibo1/ciudadano/${id}`);
        if (!response.ok) throw new Error('No se encontró información para este ciudadano.');

        const datos = await response.json();
        
        // Al usar un INNER JOIN, tomamos el primer elemento del arreglo devuelto
        const info = datos[0];
        datosCivilGlobal = info; // Almacenamos para el guardado posterior

        // Rellenar cabecera e información del ciudadano
        document.getElementById('recibo-folio').textContent = info.numero_recibo ? `No. ${info.numero_recibo}` : "No. PENDIENTE";
        document.getElementById('cliente-nombre').textContent = `${info.nombre} ${info.apellido_paterno} ${info.apellido_materno || ''}`;
        document.getElementById('cliente-domicilio').textContent = `${info.domicilio}, ${info.nombre_comunidad}`;
        document.getElementById('cliente-cuenta').textContent = info.cuenta_no || '--';
        document.getElementById('recibo-mes-pago').textContent = info.mes_pagado || mesesAnio[new Date().getMonth()];

        // Limpiar importes por defecto en la tabla
        document.getElementById('imp-domestico').textContent = "$ 0.00";
        document.getElementById('imp-comercial').textContent = "$ 0.00";

        // Asignar el monto de la tarifa de forma dinámica según su tipo de servicio
        if (info.servicio_civil === 'Domestico') {
            document.getElementById('imp-domestico').textContent = `$ ${parseFloat(info.monto).toFixed(2)}`;
        } else if (info.servicio_civil === 'Comercial') {
            document.getElementById('imp-comercial').textContent = `$ ${parseFloat(info.monto).toFixed(2)}`;
        }

        // Llenar el resto de columnas numéricas de la tabla
        document.getElementById('imp-contrato').textContent = `$ ${parseFloat(info.contrato || 0).toFixed(2)}`;
        document.getElementById('imp-tomas').textContent = `$ ${parseFloat(info.tomas_agua || 1).toFixed(2)}`;
        document.getElementById('imp-rezagos').textContent = `$ ${parseFloat(info.rezagos || 0).toFixed(2)}`;
        document.getElementById('imp-recargos').textContent = `$ ${parseFloat(info.recargos || 0).toFixed(2)}`;
        document.getElementById('imp-iva').textContent = `$ ${parseFloat(info.iva || 0).toFixed(2)}`;
        document.getElementById('imp-descuento').textContent = `$ ${parseFloat(info.descuentos || 0).toFixed(2)}`;
        
        // Colocar el gran total acumulado
        const totalFinal = parseFloat(info.total || info.monto || 0);
        document.getElementById('imp-total').innerHTML = `<strong>$ ${totalFinal.toFixed(2)}</strong>`;

        // Colocar el importe con letra de manera legible
        document.getElementById('total-letras').textContent = info.importe_letra || numeroALetras(totalFinal);

    } catch (error) {
        console.error('Error al cargar la plantilla del recibo:', error);
        alert('Hubo un problema al recuperar los datos financieros del ciudadano.');
    }
}

// Función vinculada al botón verde de tu HTML
async function generarYGuardarRecibo() {
    if (!datosCivilGlobal) {
        alert('Faltan los datos del civil para poder efectuar el registro.');
        return;
    }

    // Recuperamos el ID del usuario administrador que está operando el sistema
    const idUsuarioLogueado = localStorage.getItem('id_usuario') || 1; 
    const fecha = new Date();
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Preparamos el cuerpo que espera la ruta POST de generación masiva o individual
    const cuerpoPeticion = {
        id_usuario: parseInt(idUsuarioLogueado),
        mes: meses[fecha.getMonth()],
        anio: fecha.getFullYear()
    };

    try {
        document.getElementById('btnGenerar').disabled = true;
        document.getElementById('btnGenerar').textContent = 'Procesando registro...';

        // Disparamos la petición al endpoint indicado
        const response = await fetch('http://localhost:3000/api/recibo1/generar-mensualidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpoPeticion)
        });

        const data = await response.json();

        if (response.ok) {
            alert('¡Recibo de cobro oficial guardado y procesado exitosamente en el sistema!');
            // Redirige al historial o a la lista general de administración
            window.location.href = '../../opc_Administrador/pagos_adm.html';
        } else {
            alert(`Error del servidor: ${data.message}`);
            document.getElementById('btnGenerar').disabled = false;
            document.getElementById('btnGenerar').textContent = 'GENERAR RECIBO Y GUARDAR';
        }
    } catch (error) {
        console.error('Error en la conexión HTTP:', error);
        alert('Ocurrió un fallo en la red de comunicación con tu servidor API.');
        document.getElementById('btnGenerar').disabled = false;
        document.getElementById('btnGenerar').textContent = 'GENERAR RECIBO Y GUARDAR';
    }
}

// Función auxiliar para convertir valores numéricos a texto para la casilla municipal
function numeroALetras(numero) {
    // Conversor básico estándar simplificado para pesos mexicanos
    const pesos = Math.floor(numero);
    const centavos = Math.round((numero - pesos) * 100);
    return `${pesos} PESOS ${centavos}/100 M.N.`.toUpperCase();
}