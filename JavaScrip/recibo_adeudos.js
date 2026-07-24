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
        // 2. Consultamos todos los adeudos pendientes del servidor
        const respuesta = await fetch("http://localhost:3000/api/adeudos/");
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
        
        // 💡 AGRUPAR MESES: Construir la lista de meses adeudados
        const listaMeses = adeudosDelCliente.map(item => (item.mes_adeudo || 'JULIO').toUpperCase());
        const anioTexto = base.anio_adeudo || String(fechaActual.getFullYear());
        
        // Muestra en vista previa: "SEPTIEMBRE, OCTUBRE, NOVIEMBRE, DICIEMBRE, AGOSTO DE 2026"
        document.getElementById("recibo-mes-pago").textContent = `${listaMeses.join(", ")} DE ${anioTexto}`;
        document.getElementById("recibo-folio").textContent = `No. RZ-${base.id_adeudo}`;

        // 💡 CALCULAR TOTAL ACUMULADO
        const totalRezago = adeudosDelCliente.reduce((sum, item) => sum + parseFloat(item.monto_debe || 0), 0);
       
        document.getElementById("imp-domestico").textContent = base.tipo_servicio?.toLowerCase() !== 'comercial' ? `$ ${totalRezago.toFixed(2)}` : "$ 0.00";
        document.getElementById("imp-comercial").textContent = base.tipo_servicio?.toLowerCase() === 'comercial' ? `$ ${totalRezago.toFixed(2)}` : "$ 0.00";
        document.getElementById("imp-contrato").textContent = "$ 0.00";
        document.getElementById("imp-tomas").textContent = `${base.tomas_agua || '1'}`;
        document.getElementById("imp-recargos").textContent = "$ 0.00";
        document.getElementById("imp-iva").textContent = "$ 6.00";
        document.getElementById("imp-descuento").textContent = "$ 0.00";
        document.getElementById("imp-rezagos").textContent = "$ 0.00";
        document.getElementById("imp-total").textContent = `$ ${totalRezago.toFixed(2)}`;

        // Convertir importe numérico a texto legal
        document.getElementById("total-letras").textContent = numeroALetras(totalRezago);

        // =================================================================
        // 6. ASIGNACIÓN EXCLUSIVA AL BOTÓN (LIQUIDAR MULTI-MES CORREGIDO)
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

                    // Calculated unit value per month
                    const cantidadMeses = listaMeses.length || 1;
                    const montoUnitarioPorMes = totalRezago / cantidadMeses;

                    // Estructuramos el JSON limpio sin cadenas concatenadas de texto
                    const cuerpoPeticion = {
                        fecha_pago: new Date().toISOString().slice(0, 19).replace('T', ' '),
                        
                        // 🎯 SE ENVÍA EL ARRAY COMPLETO DE MESES PARA PROCESAR INDIVIDUALMENTE
                        meses: listaMeses,               
                        mes_pagado: listaMeses[0],       
                        
                        anio: parseInt(anioTexto),
                        contrato: 0.00,
                        tipo_servicio: base.tipo_servicio?.toLowerCase() === 'comercial' ? 2 : 1, 
                        tomas_agua: parseFloat(base.tomas_agua || 1),
                        rezagos: 0.00,
                        recargos: 0.00,
                        iva: 0.00,
                        descuentos: 0.00,
                        
                        // 🎯 PRECIOS DIVIDIDOS CORRECTAMENTE
                        total_por_mes: montoUnitarioPorMes, 
                        total: totalRezago,                
                        
                        importe_letra: document.getElementById("total-letras").textContent,
                        id_ciudadano: idCiudadanoFinal, 
                        id_usuario: idUsuarioLogueado,
                        id_adeudo: idsAdeudosArray[0],
                        ids_adeudos: idsAdeudosArray   
                    };

                    console.log("Enviando liquidación corregida al Servidor:", cuerpoPeticion);

                    const respuestaPago = await fetch("http://localhost:3000/api/recibo/liquidar_rezago", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(cuerpoPeticion)
                    });

                    const resultado = await respuestaPago.json();

                    if (respuestaPago.ok || resultado.success) {
                        alert(resultado.message || "¡Los adeudos seleccionados han sido liquidados y guardados exitosamente!");
                        
                        // Redireccionamiento según el rol
                        if (rolUsuario === "admin") {
                            window.location.href = "resagados_adm.html";
                        } else {
                            window.location.href = "resagados.html";
                        }
                    } else {
                        alert(`Error al procesar el pago: ${resultado.message}`);
                        botonLiquidar.disabled = false;
                        botonLiquidar.textContent = "LIQUIDAR ADEUDO Y GUARDAR";
                    }

                } catch (error) {
                    console.error("Error en el proceso de liquidación:", error);
                    alert("Error crítico de red. No se pudo concretar la comunicación con el servidor.");
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