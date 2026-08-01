let datosCivilGlobal = null;
const mesesAnio = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Extraemos la cuenta de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const cuentaCiudadano = urlParams.get('cuenta');

    if (!cuentaCiudadano) {
        alert('Error: No se detectó un número de cuenta válido en la URL.');
        return;
    }

    // 2. Cargamos la fecha actual de emisión
    const fecha = new Date();
    document.getElementById('fecha-dia').textContent = String(fecha.getDate()).padStart(2, '0');
    document.getElementById('fecha-mes').textContent = mesesAnio[fecha.getMonth()];
    document.getElementById('fecha-anio').textContent = String(fecha.getFullYear()); 

    // Selector de año
    const selectAnio = document.getElementById('select-anio');
    if (selectAnio) selectAnio.value = String(fecha.getFullYear());

    // 3. Consultar datos de la API
    await cargarDatosDelRecibo(cuentaCiudadano);

    // 4. Escuchadores para recálculo automático
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

    document.querySelectorAll('.grid-meses input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', calcularSumaTotalManual);
    });

    // 5. Vincular el botón de guardar
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
        if (!info || (!info.nombre && !info.nombre_completo)) {
            alert('El servidor no devolvió datos válidos.');
            return;
        }

        datosCivilGlobal = info;

        document.getElementById('recibo-folio').textContent = "No. PENDIENTE";
        document.getElementById('cliente-nombre').textContent = `${info.nombre || ''} ${info.apellido_paterno || ''} ${info.apellido_materno || ''}`.toUpperCase().trim();
        document.getElementById('cliente-domicilio').textContent = `${info.domicilio || 'CONOCIDO'}, ${info.nombre_comunidad || info.comunidad || ''}`.toUpperCase().trim();
        document.getElementById('cliente-cuenta').textContent = info.cuenta_no || info.cuenta || info.id_ciudadano || '--';

        const montoBase = parseFloat(info.monto || info.monto_debe || info.monto_tarifa || info.tarifa || info.precio || 0);
        const tipoServicio = String(info.tipo_servicio || info.nombre_servicio || '').toLowerCase();
        const esDomestico = tipoServicio === '1' || tipoServicio === 'domestico' || tipoServicio === 'doméstico';

        const inputDomestico = document.getElementById('imp-domestico');
        const inputComercial = document.getElementById('imp-comercial');

        if (esDomestico) {
            asignarValorFijo(inputDomestico, montoBase.toFixed(2));
            asignarValorFijo(inputComercial, "0.00");
        } else {
            asignarValorFijo(inputComercial, montoBase.toFixed(2));
            asignarValorFijo(inputDomestico, "0.00");
        }

        const inputTomas = document.getElementById('imp-tomas');
        const cantidadTomas = parseInt(info.tomas_agua || info.tomas || info.numero_tomas || 1);
        asignarValorFijo(inputTomas, cantidadTomas);

        calcularSumaTotalManual();

    } catch (error) {
        console.error('Error al cargar la plantilla del recibo:', error);
        alert('Hubo un problema al recuperar los datos financieros del ciudadano.');
    }
}

function asignarValorFijo(elemento, valor) {
    if (!elemento) return;
    if (elemento.tagName === 'INPUT') {
        elemento.value = valor;
        elemento.readOnly = true;
        elemento.disabled = true;
        elemento.style.backgroundColor = '#e9ecef';
        elemento.style.cursor = 'not-allowed';
    } else {
        elemento.textContent = valor;
    }
}

function obtenerValorCampo(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return el.tagName === 'INPUT' ? el.value : el.textContent.replace('$', '').trim();
}

function calcularSumaTotalManual() {
    const domestico = parseFloat(obtenerValorCampo('imp-domestico')) || 0;
    const comercial = parseFloat(obtenerValorCampo('imp-comercial')) || 0;
    const contrato = parseFloat(obtenerValorCampo('imp-contrato')) || 0;
    const rezagos = parseFloat(obtenerValorCampo('imp-rezagos')) || 0;
    const recargos = parseFloat(obtenerValorCampo('imp-recargos')) || 0;
    const iva = parseFloat(obtenerValorCampo('imp-iva')) || 0;
    const descuento = parseFloat(obtenerValorCampo('imp-descuento')) || 0;

    const checkboxesMarcados = document.querySelectorAll('.grid-meses input[type="checkbox"]:checked');
    const cantidadMeses = Math.max(1, checkboxesMarcados.length);

    const subtotalPorMes = (domestico + comercial) + contrato + rezagos + recargos + iva;
    const totalPorMes = Math.max(0, subtotalPorMes - descuento);

    const totalFinal = totalPorMes * cantidadMeses;

    const elemTotal = document.getElementById('imp-total');
    if (elemTotal) {
        elemTotal.innerHTML = `<strong>$ ${totalFinal.toFixed(2)}</strong>`;
    }

    const elemLetras = document.getElementById('total-letras');
    if (elemLetras) {
        elemLetras.textContent = numeroALetras(checkboxesMarcados.length > 0 ? totalFinal : 0);
    }
}

// 🧹 LIMPIAR FORMULARIO Y SALTAR AL SIGUIENTE AÑO
function prepararSiguienteAnio() {
    document.querySelectorAll('.grid-meses input[type="checkbox"]').forEach(chk => {
        chk.checked = false;
    });

    const selectAnio = document.getElementById('select-anio');
    if (selectAnio) {
        const anioActual = parseInt(selectAnio.value);
        selectAnio.value = String(anioActual + 1);
    }

    ['imp-contrato', 'imp-rezagos', 'imp-recargos', 'imp-iva', 'imp-descuento'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "0.00";
    });

    calcularSumaTotalManual();
}

async function generarYGuardarRecibo() {
    if (!datosCivilGlobal) {
        alert('Faltan los datos del ciudadano para efectuar el registro.');
        return;
    }

    const checkboxes = document.querySelectorAll('.grid-meses input[type="checkbox"]:checked');
    const mesesSeleccionados = Array.from(checkboxes).map(cb => cb.value);

    if (mesesSeleccionados.length === 0) {
        alert('Por favor selecciona al menos un mes a pagar.');
        return;
    }

    const selectAnio = document.getElementById('select-anio');
    const anioCobro = selectAnio ? parseInt(selectAnio.value) : new Date().getFullYear();

    // 🔍 DETERMINAR SI ES ANUAL O MENSUAL
    const esAnual = (mesesSeleccionados.length === 12);
    const tipoPagoElegido = esAnual ? 'Anual' : 'Mensual';

    const domestico = parseFloat(obtenerValorCampo('imp-domestico')) || 0;
    const comercial = parseFloat(obtenerValorCampo('imp-comercial')) || 0;
    const contrato = parseFloat(obtenerValorCampo('imp-contrato')) || 0;
    const tomasAgua = parseFloat(obtenerValorCampo('imp-tomas')) || 1;
    const rezagos = parseFloat(obtenerValorCampo('imp-rezagos')) || 0;
    const recargos = parseFloat(obtenerValorCampo('imp-recargos')) || 0;
    const iva = parseFloat(obtenerValorCampo('imp-iva')) || 0;
    const descuentos = parseFloat(obtenerValorCampo('imp-descuento')) || 0;

    const subtotalUnitario = (domestico + comercial) + contrato + rezagos + recargos + iva;
    const totalUnitario = Math.max(0, subtotalUnitario - descuentos);

    const mensajeAlerta = esAnual 
        ? `¿Confirmas el registro del PAGO ANUAL COMPLETO para el año ${anioCobro}?` 
        : `¿Confirmas registrar ${mesesSeleccionados.length} mes(es) del AÑO ${anioCobro}?`;

    const sePago = confirm(`${mensajeAlerta}\n\n[Aceptar = Registrar como PAGADO]\n[Cancelar = Registrar como PENDIENTE]`);
    const fechaPagoFinal = sePago ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
    const estadoElegido = sePago ? 'Pagado' : 'Pendiente';

    const idUsuarioLogueado = localStorage.getItem('id_usuario') || 1; 

    // 📦 ESTRUCTURA ULTRA-COMPATIBLE CON BACKEND
    const cuerpoPeticion = {
        fecha_pago: fechaPagoFinal,
        meses: mesesSeleccionados,
        anio: anioCobro,
        contrato: contrato,
        tipo_servicio: (comercial > 0) ? 2 : 1,
        tomas_agua: tomasAgua,
        rezagos: rezagos,
        recargos: recargos,
        iva: iva,
        descuentos: descuentos,
        total_por_mes: totalUnitario,
        importe_letra: document.getElementById('total-letras').textContent,
        id_ciudadano: datosCivilGlobal.id_ciudadano || datosCivilGlobal.id,
        id_usuario: parseInt(idUsuarioLogueado),
        estado_recibo: estadoElegido,
        tipo_pago: tipoPagoElegido,
        es_pago_anual: esAnual ? 1 : 0 // Se manda en binario (1 o 0) para compatibilidad absoluta con bases de datos MySQL/PostgreSQL
    };

    const btn = document.getElementById('btnGenerar');

    try {
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
            alert(data.message || '¡Registro procesado exitosamente!');
            
            // Preguntar si se quiere cobrar otro período
            const continuarOtroAnio = confirm(`¿Deseas cobrar otro período/año para esta misma cuenta?`);

            if (continuarOtroAnio) {
                prepararSiguienteAnio();
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'GENERAR RECIBO Y GUARDAR';
                }
            } else {
                window.location.href = '../html/barrios_chiconamel.html';
            }

        } else {
            alert(`Atención del Sistema: ${data.message || data.error}`);
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'GENERAR RECIBO Y GUARDAR';
            }
        }
    } catch (error) {
        console.error('Error en la conexión HTTP:', error);
        alert('Ocurrió un fallo en la red de comunicación con tu servidor API.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'GENERAR RECIBO Y GUARDAR';
        }
    }
}

function numeroALetras(num) {
    if (num <= 0) return 'CERO PESOS 00/100 M.N.';
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