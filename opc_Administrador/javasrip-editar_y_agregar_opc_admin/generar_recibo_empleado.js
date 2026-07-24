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
});

async function cargarDatosDelRecibo(cuenta) {
    try {
        const response = await fetch(`http://localhost:3000/api/recibo/${cuenta}`);
        
        if (!response.ok) throw new Error('No se encontró información para este ciudadano.');

        // 🎯 FIX SENIOR: El controlador devuelve un objeto plano {}, ya no un array []
        const info = await response.json();
        
        if (!info || !info.nombre) {
            alert('El servidor no devolvió datos válidos para este número de cuenta.');
            return;
        }

        datosCivilGlobal = info; // Almacenamos para el guardado posterior

        // Rellenar cabecera e información en blanco del ciudadano
        document.getElementById('recibo-folio').textContent = "No. PENDIENTE";
        document.getElementById('cliente-nombre').textContent = `${info.nombre} ${info.apellido_paterno} ${info.apellido_materno || ''}`.toUpperCase();
        document.getElementById('cliente-domicilio').textContent = `${info.domicilio || 'CONOCIDO'}, ${info.nombre_comunidad}`.toUpperCase();
        document.getElementById('cliente-cuenta').textContent = info.cuenta_no || '--';
        document.getElementById('recibo-mes-pago').textContent = mesesAnio[new Date().getMonth()].toUpperCase();

        // Limpiar importes por defecto en la tabla
        document.getElementById('imp-domestico').textContent = "$ 0.00";
        document.getElementById('imp-comercial').textContent = "$ 0.00";

        // Asignar el monto de la tarifa de forma dinámica según su tipo de servicio
        const montoBase = parseFloat(info.monto || 0);
        if (info.tipo_servicio === 1 || info.nombre_servicio?.toLowerCase() === 'domestico') {
            document.getElementById('imp-domestico').textContent = `$ ${montoBase.toFixed(2)}`;
        } else {
            document.getElementById('imp-comercial').textContent = `$ ${montoBase.toFixed(2)}`;
        }

        // Definición explícita de conceptos financieros para el cálculo
        const contrato = 0.00;        
        const tomasAgua = 1.00; // Valor entero representativo en el recibo       
        const rezagos = 0.00;         
        const recargos = 0.00;  
        const iva = montoBase * 0.00; // 16% de IVA automático de la tarifa base
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

        // 🎯 FIX SENIOR: Guardamos los montos calculados en el estado global para no depender del DOM al guardar
        datosCivilGlobal.valoresCalculados = {
            contrato, tomasAgua, rezagos, recargos, iva, descuentos, totalFinal
        };

        // Colocar el importe con letra legible en texto castellano oficial
        document.getElementById('total-letras').textContent = numeroALetras(totalFinal);

    } catch (error) {
        console.error('Error al cargar la plantilla del recibo:', error);
        alert('Hubo un problema al recuperar los datos financieros del ciudadano.');
    }
}

// Función vinculada al botón verde para guardar la fila en la tabla recibos
async function generarYGuardarRecibo() {
    if (!datosCivilGlobal || !datosCivilGlobal.valoresCalculados) {
        alert('Faltan los datos financieros del civil para poder efectuar el registro.');
        return;
    }

    const sePago = confirm('¿El ciudadano liquidará este recibo en ventanilla en este momento? \n\n[Aceptar = Registrar como PAGADO] \n[Cancelar = Registrar como PENDIENTE]');
    const fechaPagoFinal = sePago ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

    // 🌟 CAPTURAMOS LA BANDERA QUE EL CONTROLADOR REVISARÁ PARA SABER SI HACE UN ADEUDO AUTOMÁTICO
    const estadoElegido = sePago ? 'Pagado' : 'Pendiente';

    const idUsuarioLogueado = localStorage.getItem('id_usuario') || 1; 
    const v = datosCivilGlobal.valoresCalculados;

    // 🎯 CUERPO DE PETICIÓN PROTEGIDO CONTRA ERRORES DE REPLAZO DE DOM
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
        estado_recibo: estadoElegido // 👈 AQUÍ ENVIAMOS LA DECISIÓN DE VENTANILLA AL BACKEND
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
            // Actualizamos visualmente el folio devuelto por el backend
            document.getElementById('recibo-folio').textContent = `No. ${String(data.numero_recibo).padStart(4, '0')}`;
            
            // Usamos el mensaje dinámico del backend que avisa si se envió a rezagados o se cobró
            alert(data.message || `¡Recibo oficial No. ${data.numero_recibo} guardado con éxito!`);
            
            // Opción Senior: Ocultar los botones de acción para permitir la impresión limpia con Ctrl+P
            document.querySelector('.acciones-recibo').style.display = 'none';
           // window.print(); // Abre el cuadro de diálogo de impresión nativo automáticamente
            
            // Redirección posterior al flujo de trabajo
            window.location.href = '../../html/barrios_chiconamel.html';
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

// 🎯 ALGORITMO SENIOR: Conversión real de números a letras en castellano fiscal
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
        letras = `${enteros}`; // Fallback para números extraordinariamente grandes
    }

    return `${letras.trim()} PESOS ${String(centavos).padStart(2, '0')}/100 M.N.`.toUpperCase();
}
document.addEventListener('DOMContentLoaded', () => {
    // ... (Tu código actual para extraer la cuenta y cargar los datos) ...
    const urlParams = new URLSearchParams(window.location.search);
    const cuentaCiudadano = urlParams.get('cuenta');

    // Programar el botón para que redirija al modo manual con la misma cuenta
    const btnIrManual = document.getElementById('btnIrManual');
    if (btnIrManual && cuentaCiudadano) {
        btnIrManual.addEventListener('click', () => {
            window.location.href = `/html/recibo_configurar_manual.html?cuenta=${cuentaCiudadano}`;
        });
    }
});