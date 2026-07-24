document.addEventListener("DOMContentLoaded", () => {
    const inputBuscar = document.getElementById("buscar-rezagado");
    if (inputBuscar) {
        inputBuscar.addEventListener("input", filtrarTablaPorNombre);
    }

    cargarPagosAnualesDinamico();
});

async function cargarPagosAnualesDinamico() {
    const tabla = document.getElementById("tabla-rezagados");
    const URL_API = "http://localhost:3000/api/recibo/"; 

    try {
        const respuesta = await fetch(URL_API);
        if (!respuesta.ok) throw new Error("Error en la petición a la API");

        const recibos = await respuesta.json();

        if (!Array.isArray(recibos) || recibos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 20px;">No hay recibos registrados.</td></tr>`;
            return;
        }

        // 🔄 AGRUPAR RECIBOS POR NÚMERO DE CUENTA
        const cuentasAgrupadas = {};

        recibos.forEach(recibo => {
            const cuenta = recibo.cuenta_no || recibo.id_ciudadano;
            
            if (!cuentasAgrupadas[cuenta]) {
                cuentasAgrupadas[cuenta] = {
                    id_recibo: recibo.id_recibo,
                    nombre: recibo.nombre,
                    apellido_paterno: recibo.apellido_paterno,
                    apellido_materno: recibo.apellido_materno,
                    cuenta_no: cuenta,
                    nombre_comunidad: recibo.nombre_comunidad,
                    domicilio: recibo.domicilio,
                    tipo_servicio: recibo.tipo_servicio,
                    totalAcumulado: 0,
                    descuentoAcumulado: 0,
                    meses: []
                };
            }

            cuentasAgrupadas[cuenta].totalAcumulado += parseFloat(recibo.total || 0);
            cuentasAgrupadas[cuenta].descuentoAcumulado += parseFloat(recibo.descuentos || 0);
            if (recibo.mes_pagado) {
                cuentasAgrupadas[cuenta].meses.push(recibo.mes_pagado.trim());
            }
        });

        tabla.innerHTML = "";

        // RENDERIZAR UNA SOLA FILA POR CIUDADANO
        Object.values(cuentasAgrupadas).forEach(c => {
            const fila = document.createElement("tr");
            const tipoServicioTexto = c.tipo_servicio === 2 ? "COMERCIAL" : "DOMÉSTICO";
            
            // Si tiene 12 o más registros/meses o abarca Enero-Diciembre, mostramos PAGO ANUAL
            const textoMeses = c.meses.length >= 12 
                ? "ENERO - DICIEMBRE (PAGO ANUAL)" 
                : c.meses.join(", ");

            fila.innerHTML = `
                <td>${c.id_recibo || '--'}</td>
                <td>${(c.nombre || '').toUpperCase()}</td>
                <td>${(c.apellido_paterno || '').toUpperCase()}</td>
                <td>${(c.apellido_materno || '').toUpperCase()}</td>
                <td><strong>${c.cuenta_no || '--'}</strong></td>
                <td>${(c.nombre_comunidad || 'CHICONAMEL').toUpperCase()}</td>
                <td>${(c.domicilio || 'CONOCIDO').toUpperCase()}</td>
                <td>${tipoServicioTexto}</td>
                <td>$${c.totalAcumulado.toFixed(2)}</td>
                <td>$${c.descuentoAcumulado.toFixed(2)}</td>
                <td><span style="background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${textoMeses}</span></td>
                
                
            `;

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al agrupar pagos:", error);
    }
}

// Buscador dinámico por nombre o cuenta
function filtrarTablaPorNombre() {
    const query = document.getElementById("buscar-rezagado").value.toLowerCase().trim();
    const filas = document.querySelectorAll("#tabla-rezagados tr");

    filas.forEach(fila => {
        if (fila.cells.length < 5) return;

        const textoFila = (
            fila.cells[1].textContent + " " + 
            fila.cells[2].textContent + " " + 
            fila.cells[3].textContent + " " + 
            fila.cells[4].textContent
        ).toLowerCase();

        fila.style.display = textoFila.includes(query) ? "" : "none";
    });
}