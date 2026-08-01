document.addEventListener("DOMContentLoaded", () => {
    const inputBuscar = document.getElementById("buscar-rezagado");
    if (inputBuscar) {
        inputBuscar.addEventListener("input", filtrarTablaPorNombre);
    }

    cargarPagosAnualesDinamico();
});

async function cargarPagosAnualesDinamico() {
    const tabla = document.getElementById("tabla-rezagados");
    const URL_API = "http://localhost:3000/api/recibo/pagos_anuales_civiles"; 

    try {
        const respuesta = await fetch(URL_API);
        if (!respuesta.ok) throw new Error("Error en la petición a la API");

        const recibos = await respuesta.json();

        tabla.innerHTML = "";

        // Si la API no devuelve ningún usuario puntual
        if (!Array.isArray(recibos) || recibos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px; font-style: italic;">No se han registrado usuarios con Pago Anual Completo.</td></tr>`;
            return;
        }

        // 🚀 RENDERIZAR DATOS
        recibos.forEach((c, index) => {
            const fila = document.createElement("tr");

            // Validar tipo de servicio (Comercial / Doméstico)
            const tipoServicioTexto = (c.tipo_servicio === 2 || String(c.tipo_servicio).toLowerCase() === 'comercial') ? "COMERCIAL" : "DOMÉSTICO";

            // Formatear montos a 2 decimales
            const total = parseFloat(c.totalAcumulado || 0).toFixed(2);
            const descuento = parseFloat(c.descuentoAcumulado || 0).toFixed(2);

            // Año del pago (usa anio_inicio de la BD)
            const anioPago = c.anio_inicio || new Date().getFullYear();
            const primerMes = c.primer_mes;
            const segundoMes = c.ultimo_mes;
            fila.innerHTML = `
                <td>${c.id_ciudadano || (index + 1)}</td>
                <td>${(c.nombre || '').toUpperCase()}</td>
                <td>${(c.apellido_paterno || '').toUpperCase()}</td>
                <td>${(c.apellido_materno || '').toUpperCase()}</td>
                <td><strong>${c.cuenta_no || '--'}</strong></td>
                <td>${(c.nombre_comunidad || 'CHICONAMEL').toUpperCase()}</td>
                <td>${(c.domicilio || 'CONOCIDO').toUpperCase()}</td>
                <td>${tipoServicioTexto}</td>
                <td>$${total}</td>
                <td>$${descuento}</td>
                <td>
                    <span style="background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block;">
                        ${primerMes} ${segundoMes} ${anioPago} (PAGO ANUAL)
                    </span>
                </td>
            `;

            tabla.appendChild(fila);
        });

    } catch (error) {
        console.error("Error al cargar pagos anuales:", error);
        tabla.innerHTML = `<tr><td colspan="11" style="text-align: center; color: red; padding: 20px;">Error al obtener los datos del servidor.</td></tr>`;
    }
}

// Buscador dinámico por Nombre, Apellidos o Número de Cuenta
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