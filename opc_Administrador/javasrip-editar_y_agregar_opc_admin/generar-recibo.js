// Variable global y arreglo de meses accesibles por todo el documento
let datosCivilGlobal = null;
const mesesAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Extraemos el parámetro 'cuenta' que manda la URL (?cuenta=10121)
    const urlParams = new URLSearchParams(window.location.search);
    const cuentaCiudadano = urlParams.get('cuenta');

    if (!cuentaCiudadano) {
        alert('Error: No se detectó un número de cuenta válido en la URL para generar el recibo.');
        return;
    }

    // Programar el botón para que redirija al modo manual con la misma cuenta
    const btnIrManual = document.getElementById('btnIrManual');
    if (btnIrManual) {
        btnIrManual.addEventListener('click', () => {
            window.location.href = `../../opc_Administrador/recibo_configurar_manual_adm.html?cuenta=${cuentaCiudadano}`;
        });
    }

    // 2. Cargamos la fecha actual en los campos correspondientes del recibo impreso
    const fecha = new Date();
    document.getElementById('fecha-dia').textContent = String(fecha.getDate()).padStart(2, '0');
    document.getElementById('fecha-mes').textContent = mesesAnio[fecha.getMonth()];
    document.getElementById('fecha-anio').textContent = String(fecha.getFullYear()); 

    // 3. Consultamos el endpoint usando la cuenta del ciudadano
    await cargarDatosDelRecibo(cuentaCiudadano);
});

// =========================================================================
// CARGA DE DATOS DEL RECIBO (CON RESPALDO EN LOCALHOST)
// =========================================================================
async function cargarDatosDelRecibo(cuenta) {
    const endpointRecibo = `/api/recibo/${cuenta}`;
    let response;

    try {
        // 💡 1. Primer intento: IP/Host dinámico según el navegador
        response = await fetch(`http://${window.location.hostname}:3000${endpointRecibo}`);
    } catch (netError) {
        console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
        try {
            // 🔄 2. Segundo intento (Respaldo en caso de fallo de red local): conecta a localhost
            response = await fetch(`http://localhost:3000${endpointRecibo}`);
        } catch (localError) {
            console.error('❌ Error crítico en la petición del recibo:', localError);
            alert('Error de conexión. Asegúrate de que el servidor de backend esté corriendo.');
            return;
        }
    }

    try {
        if (!response || !response.ok) {
            throw new Error('No se encontró información para este ciudadano.');
        }

        // El controlador devuelve un objeto plano {}
        const info = await response.json();
        
        if (!info || !info.nombre) {
            alert('El servidor no devolvió datos válidos para este número de cuenta.');
            return;
        }

        datosCivilGlobal = info; // Almacenamos para el guardado posterior

        // Rellenar cabecera e información del ciudadano
        document.getElementById('recibo-folio').textContent = "No. PENDIENTE";
        document.getElementById('cliente-nombre').textContent = `${info.nombre} ${info.apellido_paterno} ${info.apellido_materno || ''}`.toUpperCase();
        document.getElementById('cliente-domicilio').textContent = `${info.domicilio || 'CONOCIDO'}, ${info.nombre_comunidad}`.toUpperCase();
        document.getElementById('cliente-cuenta').textContent = info.cuenta_no || '--';
        document.getElementById('recibo-mes-pago').textContent = mesesAnio[new Date().getMonth()].toUpperCase();

        // Limpiar importes por defecto en la tabla
        document.getElementById('imp-domestico').textContent = "$ 0.00";
        document.getElementById('imp-comercial').textContent = "$ 0.00";

        // 🎯 AJUSTE DOMESTICO 2:
        // Evaluamos si es Doméstico (1), Doméstico 2 (3), o si la propiedad de texto incluye "domestico"
        const montoBase = parseFloat(info.monto || 0);
        const servicioNombre = (info.nombre_servicio || info.tipo_servicio_nombre || '').toLowerCase();

        if (info.tipo_servicio === 1 || info.tipo_servicio === 3 || servicioNombre.includes('domestico')) {
            document.getElementById('imp-domestico').textContent = `$ ${montoBase.toFixed(2)}`;
        } else {
            document.getElementById('imp-comercial').textContent = `$ ${montoBase.toFixed(2)}`;
        }

        // Definición explícita de conceptos financieros para el cálculo
        const contrato = 0.00;        
        const tomasAgua = 1.00; // Valor entero representativo en el recibo        
        const rezagos = 0.00;         
        const recargos = 0.00;  
        let iva = 6.00;
       
        if (info.tipo_servicio === 3 || servicioNombre.includes('domestico_2') || servicioNombre.includes('domestico 2')) {
            iva = 7.00;
        }
        const descuentos = 0.00;

        document.getElementById('imp-contrato').textContent = `$ ${contrato.toFixed(2)}`;
        document.getElementById('imp-tomas').textContent = `${tomasAgua}`;
        document.getElementById('imp-rezagos').textContent = `$ ${rezagos.toFixed(2)}`;
        document.getElementById('imp-recargos').textContent = `$ ${recargos.toFixed(2)}`;
        document.getElementById('imp-iva').textContent = `$ ${iva.toFixed(2)}`;
        document.getElementById('imp-descuento').textContent = `$ ${descuentos.toFixed(2)}`;
        
        // Calcular el gran total acumulado de forma segura
        const totalFinal = (montoBase + contrato + rezagos + recargos + iva) - descuentos;
        document.getElementById('imp-total').innerHTML = `<strong>$ ${totalFinal.toFixed(2)}</strong>`;

        // Guardamos los montos calculados en el estado global para el guardado
        datosCivilGlobal.valoresCalculados = {
            contrato, tomasAgua, rezagos, recargos, iva, descuentos, totalFinal
        };

        // Colocar el importe con letra
        document.getElementById('total-letras').textContent = numeroALetras(totalFinal);

    } catch (error) {
        console.error('Error al cargar la plantilla del recibo:', error);
        alert('Hubo un problema al recuperar los datos financieros del ciudadano.');
    }
}

// =========================================================================
// GENERAR Y GUARDAR RECIBO INDIVIDUAL (CON RESPALDO EN LOCALHOST)
// =========================================================================
async function generarYGuardarRecibo() {
    if (!datosCivilGlobal || !datosCivilGlobal.valoresCalculados) {
        alert('Faltan los datos financieros del civil para poder efectuar el registro.');
        return;
    }

    const sePago = confirm('¿El ciudadano liquidará este recibo en ventanilla en este momento? \n\n[Aceptar = Registrar como PAGADO] \n[Cancelar = Registrar como PENDIENTE]');
    const fechaPagoFinal = sePago ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    const estadoElegido = sePago ? 'Pagado' : 'Pendiente';
    const idUsuarioLogueado = localStorage.getItem('id_usuario') || 1; 
    const v = datosCivilGlobal.valoresCalculados;

    const cuerpoPeticion = {
        fecha_pago: fechaPagoFinal,
        mes_pagado: document.getElementById('recibo-mes-pago').textContent,
        anio: new Date().getFullYear(),
        contrato: v.contrato,
        tipo_servicio: datosCivilGlobal.tipo_servicio,
        tomas_agua: v.tomasAgua,
        rezagos: v.rezagos,
        recargos: v.recargos,
        iva: v.iva,
        descuentos: v.descuentos,
        total: v.totalFinal,
        importe_letra: document.getElementById('total-letras').textContent,
        id_ciudadano: datosCivilGlobal.id_ciudadano,
        id_usuario: parseInt(idUsuarioLogueado),
        estado_recibo: estadoElegido
    };

    const btn = document.getElementById('btnGenerar');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Procesando registro...';
    }

    const endpointGuardar = '/api/recibo/guardar-individual';
    const opcionesGuardar = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpoPeticion)
    };

    let response;

    try {
        try {
            // 💡 1. Primer intento: IP/Host dinámico según el navegador
            response = await fetch(`http://${window.location.hostname}:3000${endpointGuardar}`, opcionesGuardar);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            // 🔄 2. Segundo intento (Respaldo en caso de fallo de red local): conecta a localhost
            response = await fetch(`http://localhost:3000${endpointGuardar}`, opcionesGuardar);
        }

        if (!response) {
            throw new Error('No se obtuvo respuesta del servidor backend.');
        }

        const data = await response.json();

        if (response.ok) {
            document.getElementById('recibo-folio').textContent = `No. ${String(data.numero_recibo).padStart(4, '0')}`;
            alert(data.message || `¡Recibo oficial No. ${data.numero_recibo} guardado con éxito!`);
            
            const acciones = document.querySelector('.acciones-recibo');
            if (acciones) acciones.style.display = 'none';

            window.location.href = '../../opc_Administrador/barrios_chiconamel_adm.html';
        } else {
            alert(`Error del servidor: ${data.message}`);
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'GENERAR RECIBO Y GUARDAR';
            }
        }
    } catch (error) {
        console.error('Error en la conexión HTTP al guardar recibo:', error);
        alert('Ocurrió un fallo en la red de comunicación con tu servidor API.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'GENERAR RECIBO Y GUARDAR';
        }
    }
}

// Algoritmo para conversión de números a letras
function numeroALetras(num) {
    const Unidades = num => ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'][num];
    const Decenas = num => ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'][num];
    const DiezAVeinte = num => ['DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISETE','DIECIOCHO','DIECINUEVE'][num - 10];
    
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