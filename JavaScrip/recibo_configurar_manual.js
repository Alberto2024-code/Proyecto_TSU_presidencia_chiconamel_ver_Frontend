// Variable global y arreglo de meses accesibles por todo el documento
let datosCivilGlobal = null;
const mesesAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Extraemos el parámetro 'cuenta' que manda la URL (?cuenta=469)
    const urlParams = new URLSearchParams(window.location.search);
    const cuentaCiudadano = urlParams.get('cuenta');

    if (!cuentaCiudadano) {
        alert('Error: No se detectó un número de cuenta válido en la URL para generar el recibo.');
        return;
    }

    // 2. Cargamos la fecha actual en los spans de fecha
    const fecha = new Date();
    document.getElementById('fecha-dia').textContent = String(fecha.getDate()).padStart(2, '0');
    document.getElementById('fecha-mes').textContent = mesesAnio[fecha.getMonth()];
    document.getElementById('fecha-anio').textContent = String(fecha.getFullYear()); 

    // Marcar por defecto el mes actual en las casillas
    const nombreMesActual = mesesAnio[fecha.getMonth()];
    const checkboxMesActual = document.querySelector(`.grid-meses input[value="${nombreMesActual}"]`);
    if (checkboxMesActual) checkboxMesActual.checked = true;

    // 3. Consultamos el endpoint usando la cuenta del ciudadano
    await cargarDatosDelRecibo(cuentaCiudadano);

    // 4. Escuchadores para recalculado dinámico
    const inputsConfig = [
        'imp-domestico', 'imp-comercial', 'imp-contrato', 
        'imp-tomas', 'imp-rezagos', 'imp-recargos', 
        'imp-iva', 'imp-descuento'
    ];

    inputsConfig.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('input', calcularSumaTotalManual);
        }
    });

    // Escuchador para cuando cambien las casillas de los meses
    document.querySelectorAll('.grid-meses input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', calcularSumaTotalManual);
    });

    // Vincular la función al botón de guardar
    const btnGenerar = document.getElementById('btnGenerar');
    if (btnGenerar) {
        btnGenerar.addEventListener('click', generarYGuardarRecibo);
    }
});

async function cargarDatosDelRecibo(cuenta) {
    try {
        const response = await fetch(`http://localhost:3000/api/recibo/${cuenta}`);
        
        if (!response.ok) throw new Error('No se encontró información para este ciudadano.');

        const info = await response.json();
        
        if (!info || !info.nombre) {
            alert('El servidor no devolvió datos válidos para este número de cuenta.');
            return;
        }

        datosCivilGlobal = info; // Almacenamos para el guardado posterior

        // Rellenar cabecera estática del ciudadano
        document.getElementById('recibo-folio').textContent = "No. PENDIENTE";
        document.getElementById('cliente-nombre').textContent = `${info.nombre} ${info.apellido_paterno || ''} ${info.apellido_materno || ''}`.toUpperCase().trim();
        document.getElementById('cliente-domicilio').textContent = `${info.domicilio || 'CONOCIDO'}, ${info.nombre_comunidad || ''}`.toUpperCase().trim();
        document.getElementById('cliente-cuenta').textContent = info.cuenta_no || info.id_ciudadano || '--';

        // Asignar el monto de la tarifa base en el input correspondiente
        const montoBase = parseFloat(info.monto || 0);
        if (info.tipo_servicio === 1 || info.nombre_servicio?.toLowerCase() === 'domestico') {
            document.getElementById('imp-domestico').value = montoBase.toFixed(2);
            document.getElementById('imp-comercial').value = "0.00";
        } else {
            document.getElementById('imp-comercial').value = montoBase.toFixed(2);
            document.getElementById('imp-domestico').value = "0.00";
        }

        // Ejecutar primer cálculo automático inicial
        calcularSumaTotalManual();

    } catch (error) {
        console.error('Error al cargar la plantilla del recibo:', error);
        alert('Hubo un problema al recuperar los datos financieros del ciudadano.');
    }
}

// Función encargada de sumar la tabla multiplicando por los meses seleccionados y adaptar el texto
function calcularSumaTotalManual() {
    const domestico = parseFloat(document.getElementById('imp-domestico').value) || 0;
    const comercial = parseFloat(document.getElementById('imp-comercial').value) || 0;
    const contrato = parseFloat(document.getElementById('imp-contrato').value) || 0;
    const rezagos = parseFloat(document.getElementById('imp-rezagos').value) || 0;
    const recargos = parseFloat(document.getElementById('imp-recargos').value) || 0;
    const iva = parseFloat(document.getElementById('imp-iva').value) || 0;
    const descuento = parseFloat(document.getElementById('imp-descuento').value) || 0;

    // Contar cuántos meses se marcaron
    const checkboxesMarcados = document.querySelectorAll('.grid-meses input[type="checkbox"]:checked');
    const cantidadMeses = Math.max(1, checkboxesMarcados.length);

    // Actualizar dinámicamente el texto del mes en la vista previa del recibo si existe el span
    const spanMesPago = document.getElementById('recibo-mes-pago');
    if (spanMesPago) {
        if (cantidadMeses === 12) {
            spanMesPago.textContent = "ENERO - DICIEMBRE (PAGO ANUAL)";
        } else if (checkboxesMarcados.length > 0) {
            const listaNombres = Array.from(checkboxesMarcados).map(cb => cb.value.toUpperCase());
            spanMesPago.textContent = listaNombres.join(', ');
        }
    }

    // Suma unitaria por mes
    const subtotalPorMes = (domestico + comercial) + contrato + rezagos + recargos + iva;
    const totalPorMes = Math.max(0, subtotalPorMes - descuento);

    // Total acumulado por todos los meses seleccionados
    const totalFinal = totalPorMes * cantidadMeses;

    document.getElementById('imp-total').innerHTML = `<strong>$ ${totalFinal.toFixed(2)}</strong>`;
    document.getElementById('total-letras').textContent = numeroALetras(totalFinal);
}

// Función vinculada al botón para guardar recibos con distinción de Pago Anual vs Mensual
async function generarYGuardarRecibo() {
    if (!datosCivilGlobal) {
        alert('Faltan los datos del civil para poder efectuar el registro.');
        return;
    }

    // Obtener meses seleccionados
    const checkboxes = document.querySelectorAll('.grid-meses input[type="checkbox"]:checked');
    const mesesSeleccionados = Array.from(checkboxes).map(cb => cb.value);

    if (mesesSeleccionados.length === 0) {
        alert('Por favor selecciona al menos un mes a pagar.');
        return;
    }

    // 💡 DETERMINAMOS SI ES PAGO ANUAL (Si se marcaron los 12 meses)
    const esAnual = (mesesSeleccionados.length === 12);
    const tipoPagoElegido = esAnual ? 'Anual' : 'Mensual';

    // Leemos los valores unitarios por mes
    const domestico = parseFloat(document.getElementById('imp-domestico').value) || 0;
    const comercial = parseFloat(document.getElementById('imp-comercial').value) || 0;
    const contrato = parseFloat(document.getElementById('imp-contrato').value) || 0;
    const tomasAgua = parseFloat(document.getElementById('imp-tomas').value) || 1;
    const rezagos = parseFloat(document.getElementById('imp-rezagos').value) || 0;
    const recargos = parseFloat(document.getElementById('imp-recargos').value) || 0;
    const iva = parseFloat(document.getElementById('imp-iva').value) || 0;
    const descuentos = parseFloat(document.getElementById('imp-descuento').value) || 0;

    const subtotalUnitario = (domestico + comercial) + contrato + rezagos + recargos + iva;
    const totalUnitario = Math.max(0, subtotalUnitario - descuentos);

    const mensajeAlerta = esAnual 
        ? `¿Confirmas el registro del PAGO ANUAL COMPLETO (12 Meses)?` 
        : `¿El ciudadano liquidará ${mesesSeleccionados.length} mes(es) en ventanilla ahora mismo?`;

    const sePago = confirm(`${mensajeAlerta}\n\n[Aceptar = Registrar como PAGADO]\n[Cancelar = Registrar como PENDIENTE]`);
    const fechaPagoFinal = sePago ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
    const estadoElegido = sePago ? 'Pagado' : 'Pendiente';

    const idUsuarioLogueado = localStorage.getItem('id_usuario') || 1; 
    const anioActual = new Date().getFullYear();

    // Armamos la petición enviando la distinción de pago anual
    const cuerpoPeticion = {
        fecha_pago: fechaPagoFinal,
        meses: mesesSeleccionados, // Arreglo ej. ["Enero", "Febrero"...]
        anio: anioActual,
        contrato: contrato,
        tipo_servicio: (comercial > 0) ? 2 : 1,
        tomas_agua: tomasAgua,
        rezagos: rezagos,
        recargos: recargos,
        iva: iva,
        descuentos: descuentos,
        total_por_mes: totalUnitario,
        importe_letra: document.getElementById('total-letras').textContent,
        id_ciudadano: datosCivilGlobal.id_ciudadano,
        id_usuario: parseInt(idUsuarioLogueado),
        estado_recibo: estadoElegido,
      
        tipo_pago: tipoPagoElegido,
        es_pago_anual: esAnual
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
            alert(data.message || '¡Registro(s) procesado(s) exitosamente!');
            window.location.href = '../../opc_Administrador/barrios_chiconamel_adm.html';
        } else {
            alert(`Error del servidor: ${data.message || data.error}`);
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

// Conversión real de números a letras en castellano fiscal
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