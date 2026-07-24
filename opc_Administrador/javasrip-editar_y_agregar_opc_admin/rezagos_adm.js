document.addEventListener("DOMContentLoaded", () => {
    cargarTablaRezagadosPendientes();

    // Evento para el buscador en tiempo real por nombre o cuenta
    const buscador = document.querySelector("input[placeholder*='Ingresa el nombre']");
    if (buscador) {
        buscador.addEventListener("input", (e) => {
            const termino = e.target.value.toLowerCase().trim();
            filtrarTablaRezagados(termino);
        });
    }
});

// 📌 1. CARGAR Y AGRUPAR REZAGADOS POR CIUDADANO (CUENTA NO)
async function cargarTablaRezagadosPendientes() {
    // Buscamos la tabla dentro del DOM
    const tbody = document.querySelector("tbody") || document.getElementById("tabla-rezagados");
    const URL_API = "http://localhost:3000/api/adeudos/";

    if (!tbody) {
        console.error("No se encontró la tabla en el HTML.");
        return;
    }

    try {
        const respuesta = await fetch(URL_API);
        if (!respuesta.ok) throw new Error("Error al consultar la API de adeudos.");

        const listaAdeudos = await respuesta.json();

        // Filtrar únicamente los que están con estado PENDIENTE
        const pendientes = listaAdeudos.filter(item => {
            const estado = item.estado ? item.estado.toUpperCase() : "PENDIENTE";
            return estado === "PENDIENTE";
        });

        if (pendientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding:20px; font-weight:bold;">No hay adeudos rezagados pendientes.</td></tr>`;
            return;
        }

        // 💡 AGRUPACIÓN POR NÚMERO DE CUENTA
        // Agrupa todos los meses de un mismo usuario en un solo objeto
        const agrupadosPorCuenta = {};

        pendientes.forEach(item => {
            const cuenta = item.cuenta_no || `ID-${item.id_ciudadano}`;
            const mesActual = (item.mes_adeudo || item.mes_pagado || "MES").toUpperCase();
            const montoIndividual = parseFloat(item.monto_debe || item.total || 60);

            if (!agrupadosPorCuenta[cuenta]) {
                agrupadosPorCuenta[cuenta] = {
                    ...item,
                    mesesArray: [mesActual],
                    idsAdeudosArray: [item.id_adeudo],
                    id_adeudo_inicial: item.id_adeudo,
                    monto_total: montoIndividual
                };
            } else {
                agrupadosPorCuenta[cuenta].mesesArray.push(mesActual);
                agrupadosPorCuenta[cuenta].idsAdeudosArray.push(item.id_adeudo);
                agrupadosPorCuenta[cuenta].monto_total += montoIndividual;
            }
        });

        // 📌 2. RENDERIZAR LAS FILAS EN LA TABLA
        tbody.innerHTML = "";

        Object.values(agrupadosPorCuenta).forEach(item => {
            const fila = document.createElement("tr");

            // Determinar Tipo de Servicio
            const esComercial = item.tipo_servicio === 2 || String(item.tipo_servicio).toUpperCase() === 'COMERCIAL';
            const tipoServicioTexto = esComercial ? "COMERCIAL" : "DOMESTICO";

            // Formatear texto de año / meses (Ejemplo: "2026 (3 MESES)")
            const anioTexto = item.anio_adeudo || item.anio || 2026;
            const resumenMeses = item.mesesArray.length > 1 
                ? `${anioTexto} (${item.mesesArray.length} MESES)` 
                : `${anioTexto}/${item.mesesArray[0]}`;

            // Determinar si detecta rol de administrador
            const esAdmin = window.location.pathname.includes("resagados_adm.html");
            const rolParam = esAdmin ? "admin" : "empleado";

            fila.innerHTML = `
                <td>${item.id_adeudo_inicial}</td>
                <td>${resumenMeses}</td>
                <td>${(item.nombre || '').toUpperCase()}</td>
                <td>${(item.apellido_paterno || '').toUpperCase()}</td>
                <td>${(item.apellido_materno || '').toUpperCase()}</td>
                <td>${item.cuenta_no || '--'}</td>
                <td>${(item.comunidad || 'BARRIO TEOLOCO').toUpperCase()}</td>
                <td>${(item.domicilio || '5 DE MAYO').toUpperCase()}</td>
                <td>${tipoServicioTexto}</td>
                <td style="font-weight: bold; color: #2b2b2b;">$${item.monto_total.toFixed(2)}</td>
                <td><span style="color: #d9534f; font-weight: bold; padding: 3px 8px; border-radius: 4px;">PENDIENTE</span></td>
                <td>
                    <a href="recibo_adeudos-adm.html?id_adeudo=${item.id_adeudo_inicial}&cuenta=${item.cuenta_no}&rol=${rolParam}" 
                       class="btn-recibo" 
                       style="background-color: #28a745; color: white; padding: 6px 14px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; transition: background 0.2s;">
                        RECIBO
                    </a>
                </td>
            `;

            tbody.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al cargar y estructurar la tabla de rezagados:", error);
        tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; color:red; padding:20px;">Error al conectar con la base de datos local.</td></tr>`;
    }
}

// 📌 3. FUNCIÓN BÚSQUEDA EN TIEMPO REAL
function filtrarTablaRezagados(termino) {
    const filas = document.querySelectorAll("tbody tr");
    
    filas.forEach(fila => {
        const textoFila = fila.textContent.toLowerCase();
        if (textoFila.includes(termino)) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });
}