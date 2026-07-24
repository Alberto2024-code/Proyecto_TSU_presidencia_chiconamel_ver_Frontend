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

    // 2. Cargamos la fecha actual en los campos correspondientes del recibo impreso
    const fecha = new Date();
    document.getElementById('fecha-dia').textContent = String(fecha.getDate()).padStart(2, '0');
    document.getElementById('fecha-mes').textContent = mesesAnio[fecha.getMonth()];
    document.getElementById('fecha-anio').textContent = String(fecha.getFullYear()); 

    // 3. Consultamos el endpoint usando la cuenta del ciudadano
    await cargarDatosDelRecibo(cuentaCiudadano);

    // 4. Programar el botón para redirigir al modo manual
    const btnIrManual = document.getElementById('btnIrManual');
    if (btnIrManual) {
        btnIrManual.addEventListener('click', () => {
            window.location.href = `../../opc_Administrador/recibo_configurar_manual_adm.html?cuenta=${cuentaCiudadano}`;
        });
    }
});

async function cargarDatosDelRecibo(cuenta) {
    try {
        const response = await fetch(`http://localhost:3000/api/recibo/${cuenta}`);
        
        if (!response.ok) throw new Error('No se encontró información para este ciudadano.');

        const info = await response.json();
        
        // 🔍 DIAGNÓSTICO EN CONSOLA (Abre F12 para ver qué datos trae la BD)
        console.log("DATOS RECIBIDOS DEL BACKEND:", info);

        if (!info || (!info.nombre && !info.nombre_ciudadano)) {
            alert('El servidor no devolvió datos válidos para este número de cuenta.');
            return;
        }

        datosCivilGlobal = info; // Almacenamos para el guardado posterior

        // Rellenar cabecera e información del ciudadano
        document.getElementById('recibo-folio').textContent = info.numero_recibo ? `No. ${String(info.numero_recibo).padStart(4, '0')}` : "No. PENDIENTE";
        document.getElementById('cliente-nombre').textContent = `${info.nombre || ''} ${info.apellido_paterno || ''} ${info.apellido_materno || ''}`.trim().toUpperCase();
        document.getElementById('cliente-domicilio').textContent = `${info.domicilio || 'CONOCIDO'}, ${info.nombre_comunidad || info.comunidad || ''}`.toUpperCase();
        document.getElementById('cliente-cuenta').textContent = info.cuenta_no || cuenta || '--';
        
        const mesActualTexto = mesesAnio[new Date().getMonth()].toUpperCase();
        document.getElementById('recibo-mes-pago').textContent = info.mes_pagado || mesActualTexto;

        // Limpiar importes por defecto en la tabla
        document.getElementById('imp-domestico').textContent = "$ 0.00";
        document.getElementById('imp-comercial').textContent = "$ 0.00";

        // Asignar el monto de la tarifa de forma dinámica
        const montoBase = parseFloat(info.monto || info.monto_debe || info.total || 0);
        if (info.tipo_servicio === 1 || String(info.nombre_servicio || info.tipo_servicio).toLowerCase() === 'domestico') {
            document.getElementById('imp-domestico').textContent = `$ ${montoBase.toFixed(2)}`;
        } else {
            document.getElementById('imp-comercial').textContent = `$ ${montoBase.toFixed(2)}`;
        }

        // Conceptos financieros
        const contrato = 0.00;        
        const tomasAgua = parseFloat(info.tomas_agua || 1.00);      
        const rezagos = 0.00;         
        const recargos = 0.00;  
        const iva = 6.00; 
        const descuentos = 0.00;

        document.getElementById('imp-contrato').textContent = `$ ${contrato.toFixed(2)}`;
        document.getElementById('imp-tomas').textContent = `${tomasAgua}`;
        document.getElementById('imp-rezagos').textContent = `$ ${rezagos.toFixed(2)}`;
        document.getElementById('imp-recargos').textContent = `$ ${recargos.toFixed(2)}`;
        document.getElementById('imp-iva').textContent = `$ ${iva.toFixed(2)}`;
        document.getElementById('imp-descuento').textContent = `$ ${descuentos.toFixed(2)}`;
        
        // Calcular el total
        const totalFinal = (montoBase + contrato + rezagos + recargos + iva) - descuentos;
        document.getElementById('imp-total').innerHTML = `<strong>$ ${totalFinal.toFixed(2)}</strong>`;

        datosCivilGlobal.valoresCalculados = {
            contrato, tomasAgua, rezagos, recargos, iva, descuentos, totalFinal
        };

        document.getElementById('total-letras').textContent = numeroALetras(totalFinal);

        // =================================================================
        // 🛑 VALIDACIÓN DE PAGO (Detecta múltiples nombres de campos)
        // =================================================================
        const estadoEvaluado = String(
            info.estado_recibo || 
            info.estado || 
            info.estatus || 
            info.estado_pago || ''
        ).toUpperCase().trim();

        const esPagadoNumerico = info.pagado === 1 || info.pagado === true || info.id_recibo != null && info.fecha_pago != null;

        if (estadoEvaluado === 'PAGADO' || estadoEvaluado === 'LIQUIDADO' || esPagadoNumerico) {
            bloquearBotonPago(` ATENCIÓN: La cuenta ${cuenta} ya registra pago para ${info.mes_pagado || mesActualTexto}.`);
        } else {
            // Consulta de respaldo por si el endpoint de la cuenta no devuelve la tabla de pagos
            verificarPagoEnBackend(cuenta, mesActualTexto);
        }

    } catch (error) {
        console.error('Error al cargar la plantilla del recibo:', error);
        alert('Hubo un problema al recuperar los datos financieros del ciudadano.');
    }
}

// 📌 Función de respaldo que pregunta a la lista de pagos de la API
async function verificarPagoEnBackend(cuenta, mes) {
    try {
        const res = await fetch(`http://localhost:3000/api/adeudos/`);
        if (!res.ok) return;

        const adeudos = await res.json();
        
        // Buscar si existe un pago registrado para esta cuenta
        const pagado = adeudos.some(a => 
            String(a.cuenta_no) === String(cuenta) && 
            String(a.estado).toUpperCase() === 'PAGADO' &&
            String(a.mes_adeudo || a.mes_pagado).toUpperCase() === mes
        );

        if (pagado) {
            bloquearBotonPago(`⚠️ ESTE RECIBO YA FUE PAGADO EN SISTEMA (${mes}).`);
        }
    } catch (e) {
        console.warn("No se pudo realizar la doble verificación de pago:", e);
    }
}

// 📌 Función helper para congelar el botón
function bloquearBotonPago(mensaje) {
    alert(mensaje);
    const btnGenerar = document.getElementById('btnGenerar');
    if (btnGenerar) {
        btnGenerar.disabled = true;
        btnGenerar.textContent = 'RECIBO YA LIQUIDADO (PAGADO)';
        btnGenerar.style.backgroundColor = '#6c757d'; 
        btnGenerar.style.borderColor = '#6c757d';
        btnGenerar.style.cursor = 'not-allowed';
        
        // Clona el botón para eliminar cualquier eventListener previo que pueda activarlo
        const btnClonado = btnGenerar.cloneNode(true);
        btnGenerar.parentNode.replaceChild(btnClonado, btnGenerar);
    }
}

// Función para guardar
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

    try {
        const btn = document.getElementById('btnGenerar');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Procesando registro...';
        }

        const response = await fetch('http://localhost:3000/api/recibo/guardar-individual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuerpoPeticion)
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById('recibo-folio').textContent = `No. ${String(data.numero_recibo || data.id_recibo || 1).padStart(4, '0')}`;
            alert(data.message || `¡Recibo oficial guardado con éxito!`);
            
            const contenedorAcciones = document.querySelector('.acciones-recibo');
            if (contenedorAcciones) contenedorAcciones.style.display = 'none';
            
            window.location.href = '../../opc_Administrador/barrios_chiconamel_adm.html';
        } else {
            alert(`Error del servidor: ${data.message}`);
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'GENERAR RECIBO Y GUARDAR';
            }
        }
    } catch (error) {
        console.error('Error en la conexión HTTP:', error);
        alert('Ocurrió un fallo en la red de comunicación con tu servidor API.');
        const btn = document.getElementById('btnGenerar');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'GENERAR RECIBO Y GUARDAR';
        }
    }
}

// Conversión de números a letras
function numeroALetras(num) {
    const Unidades = num => ['','UN','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'][num];
    const Decenas = num => ['','DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'][num];
    const DiezAVeinte = num => ['DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISEIS','DIECISETE','DIECIOCHO','DIECINUEVE'][num - 10];
    
    let enteros = Math.floor(num);
    let centavos = Math.round((num - enteros) * 100);
    let letras = '';

    if (enteros === 0) letras = 'CERO';
    else if (enteros < 10) letras = Unidades(enteros);
    else if (enteros < 20) letters = DiezAVeinte(enteros);
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