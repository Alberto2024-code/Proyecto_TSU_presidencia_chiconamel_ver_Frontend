document.addEventListener("DOMContentLoaded", async () => {
    // 1. Obtener parámetros desde la URL (soporta id_adeudo o cuenta_no)
    const urlParams = new URLSearchParams(window.location.search);
    const idAdeudo = urlParams.get("id_adeudo");
    const cuentaNo = urlParams.get("cuenta");
    const rolUsuario = urlParams.get("rol") || "empleado"; 

    let adeudosDelCliente = []; 

    if (!idAdeudo && !cuentaNo) {
        alert("Error: Falta el ID del adeudo o el número de cuenta en la URL.");
        return;
    }

    try {
        // =========================================================================
        // 2. CONSULTAR ADEUDOS PENDIENTES (CON RESPALDO EN LOCALHOST)
        // =========================================================================
        const endpointAdeudos = '/api/adeudos/';
        let respuesta;

        try {
            // 💡 1. Primer intento: IP dinámica actual
            respuesta = await fetch(`http://${window.location.hostname}:3000${endpointAdeudos}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                respuesta = await fetch(`http://localhost:3000${endpointAdeudos}`);
            } catch (localError) {
                console.error("❌ Error crítico al consultar adeudos:", localError);
                alert("Error crítico de conexión. Verifica que el backend de Node.js esté activo.");
                return;
            }
        }

        if (!respuesta || !respuesta.ok) {
            throw new Error("No se pudo obtener la respuesta correcta del servidor de adeudos.");
        }

        const adeudos = await respuesta.json();

        // 3. Localizar los registros (Soporta cobro individual o por cuenta completa)
        if (cuentaNo) {
            adeudosDelCliente = adeudos.filter(item => item.cuenta_no == cuentaNo);
        } else {
            const exacto = adeudos.find(item => item.id_adeudo == idAdeudo);
            if (exacto) {
                // Buscar si tiene más adeudos el mismo cliente para agruparlos
                adeudosDelCliente = adeudos.filter(item => item.cuenta_no == exacto.cuenta_no);
            }
        }

        if (adeudosDelCliente.length === 0) {
            alert("No se encontraron adeudos para el cliente solicitado.");
            return;
        }

        console.log("Adeudos a procesar:", adeudosDelCliente);

        // Tomamos la información base del primer registro
        const base = adeudosDelCliente[0];

        // 4. Cargamos la fecha actual en los campos del documento
        const fechaActual = new Date();
        document.getElementById("fecha-dia").textContent = String(fechaActual.getDate()).padStart(2, '0');
        document.getElementById("fecha-mes").textContent = fechaActual.toLocaleString('es-MX', { month: 'long' }).toUpperCase();
        document.getElementById("fecha-anio").textContent = String(fechaActual.getFullYear());

        // 5. Rellenar los campos de datos del Ciudadano
        document.getElementById("cliente-nombre").textContent = 
            `${base.nombre || ''} ${base.apellido_paterno || ''} ${base.apellido_materno || ''}`.toUpperCase().trim();
        
        document.getElementById("cliente-domicilio").textContent = 
            `${base.domicilio || 'CONOCIDO'}, ${base.comunidad || ''}`.toUpperCase();
        
        document.getElementById("cliente-cuenta").textContent = base.cuenta_no || '--';
        
        // 💡 AGRUPAR MESES Y TOTAL ACUMULADO
        const listaMeses = adeudosDelCliente.map(item => (item.mes_adeudo || 'JULIO').toUpperCase());
        const anioTexto = base.anio_adeudo || String(fechaActual.getFullYear());
        const cantidadMeses = listaMeses.length || 1;
        
        document.getElementById("recibo-mes-pago").textContent = `${listaMeses.join(", ")} DE ${anioTexto}`;
        document.getElementById("recibo-folio").textContent = `No. RZ-${base.id_adeudo}`;

        // Total acumulado que se debe pagar
        const totalRezago = adeudosDelCliente.reduce((sum, item) => sum + parseFloat(item.monto_debe || 0), 0);

        // =================================================================
        // 🎯 LÓGICA DE CÁLCULO DIRECTA CON EL IVA DE LA API
        // =================================================================
        
        // 1. Leemos el IVA que viene del JSON de la API (Si viene null o vacio, asigna 6.00 por defecto)
        const ivaUnitarioBackend = parseFloat(base.iva) || 6.00;

        // 2. Multiplicamos el IVA por la cantidad de meses acumulados
        const totalAdicionalIVA = ivaUnitarioBackend * cantidadMeses;

        // 3. LA RESTA: La Cuota Base real es el Total menos el Adicional/IVA
        const cuotaBasePura = totalRezago - totalAdicionalIVA;

        // 4. Pintamos en la plantilla del recibo
        const tipoServicioStr = String(base.tipo_servicio || '').toLowerCase();
        
        if (tipoServicioStr.includes('comercial')) {
            document.getElementById("imp-domestico").textContent = "$ 0.00";
            document.getElementById("imp-comercial").textContent = `$ ${cuotaBasePura.toFixed(2)}`;
        } else {
            document.getElementById("imp-domestico").textContent = `$ ${cuotaBasePura.toFixed(2)}`;
            document.getElementById("imp-comercial").textContent = "$ 0.00";
        }

        document.getElementById("imp-contrato").textContent = "$ 0.00";
        document.getElementById("imp-tomas").textContent = `${base.tomas_agua || '1.00'}`;
        document.getElementById("imp-recargos").textContent = "$ 0.00";
        
        // Muestra $7.00 (o $6.00) multiplicado por los meses que deba
        document.getElementById("imp-iva").textContent = `$ ${totalAdicionalIVA.toFixed(2)}`; 
        
        document.getElementById("imp-descuento").textContent = "$ 0.00";
        document.getElementById("imp-rezagos").textContent = "$ 0.00";
        
        // El total cuadra exacto
        document.getElementById("imp-total").textContent = `$ ${totalRezago.toFixed(2)}`;

        // Convertir importe numérico a texto legal
        document.getElementById("total-letras").textContent = numeroALetras(totalRezago);

        // =================================================================
        // 6. ASIGNACIÓN EXCLUSIVA AL BOTÓN DE LIQUIDAR (CON RESPALDO EN LOCALHOST)
        // =================================================================
        const botonLiquidar = document.getElementById("btnGenerar");
        
        if (botonLiquidar) {
            botonLiquidar.removeAttribute("onclick");

            botonLiquidar.addEventListener("click", async () => {
                try {
                    botonLiquidar.disabled = true;
                    botonLiquidar.textContent = "Procesando pago...";

                    let idUsuarioLogueado = parseInt(localStorage.getItem('id_usuario')) || 1;
                    if (idUsuarioLogueado === 6 || isNaN(idUsuarioLogueado)) {
                        idUsuarioLogueado = 1; 
                    }

                    const idCiudadanoFinal = parseInt(base.id_ciudadano || base.id_usuario || 1);
                    const idsAdeudosArray = adeudosDelCliente.map(item => parseInt(item.id_adeudo));
                    const montoUnitarioPorMes = totalRezago / cantidadMeses;

                    const cuerpoPeticion = {
                        fecha_pago: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        meses: listaMeses,               
                        mes_pagado: listaMeses[0],       
                        anio: parseInt(anioTexto),
                        contrato: 0.00,
                        tipo_servicio: ivaUnitarioBackend === 7.00 ? 3 : (tipoServicioStr.includes('comercial') ? 2 : 1), 
                        tomas_agua: parseFloat(base.tomas_agua || 1),
                        rezagos: 0.00,
                        recargos: 0.00,
                        iva: totalAdicionalIVA,
                        descuentos: 0.00,
                        total_por_mes: montoUnitarioPorMes, 
                        total: totalRezago,                 
                        importe_letra: document.getElementById("total-letras").textContent,
                        id_ciudadano: idCiudadanoFinal, 
                        id_usuario: idUsuarioLogueado,
                        id_adeudo: idsAdeudosArray[0],
                        ids_adeudos: idsAdeudosArray   
                    };

                    console.log("Enviando liquidación al Servidor:", cuerpoPeticion);

                    const endpointLiquidar = '/api/recibo/liquidar_rezago';
                    let respuestaPago;

                    try {
                        // 💡 1. Primer intento POST: IP dinámica
                        respuestaPago = await fetch(`http://${window.location.hostname}:3000${endpointLiquidar}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(cuerpoPeticion)
                        });
                    } catch (netError) {
                        console.warn("⚠️ Falló el pago por IP/Red. Intentando conexión local directa (localhost)...");
                        try {
                            // 🔄 2. Segundo intento POST: Localhost
                            respuestaPago = await fetch(`http://localhost:3000${endpointLiquidar}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(cuerpoPeticion)
                            });
                        } catch (localError) {
                            console.error("❌ Error crítico en el envío del pago:", localError);
                            alert("Error crítico de red. No se pudo concretar la comunicación con el servidor.");
                            botonLiquidar.disabled = false;
                            botonLiquidar.textContent = "LIQUIDAR ADEUDO Y GUARDAR";
                            return;
                        }
                    }

                    const resultado = await respuestaPago.json();

                    if (respuestaPago && (respuestaPago.ok || resultado.success)) {
                        alert(resultado.message || "¡Los adeudos seleccionados han sido liquidados y guardados exitosamente!");
                        
                        if (rolUsuario === "admin") {
                            window.location.href = "resagados_adm.html";
                        } else {
                            window.location.href = "resagados.html";
                        }
                    } else {
                        alert(`Error al procesar el pago: ${resultado.message || 'Error desconocido'}`);
                        botonLiquidar.disabled = false;
                        botonLiquidar.textContent = "LIQUIDAR ADEUDO Y GUARDAR";
                    }

                } catch (error) {
                    console.error("Error en el proceso de liquidación:", error);
                    alert("Error interno al procesar el recibo.");
                    botonLiquidar.disabled = false;
                    botonLiquidar.textContent = "LIQUIDAR ADEUDO Y GUARDAR";
                }
            });
        }

    } catch (error) {
        console.error("Error al renderizar los datos del recibo:", error);
        alert("Ocurrió un error al obtener la información desde la base de datos.");
    }
});

// Función de conversión de número a letras
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