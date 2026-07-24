document.addEventListener("DOMContentLoaded", () => {
    // 1. Extraer el ID del ciudadano desde la URL (?id=X)
    const urlParams = new URLSearchParams(window.location.search);
    const idCiudadano = urlParams.get('id');

    // Validación por si acceden a la página sin un ID válido
    if (!idCiudadano) {
        const contenedor = document.getElementById("contenedor-recibos");
        contenedor.innerHTML = `<p style="grid-column: 1/-1; color: red; font-weight: bold;">
            Error: No se proporcionó el identificador del ciudadano.
        </p>`;
        return;
    }

    // 2. Llamar a la función pasándole el ID real capturado
    cargarHistorialDinamico(idCiudadano);
});

async function cargarHistorialDinamico(idCiudadano) {
    const contenedor = document.getElementById("contenedor-recibos");
    const URL_API = `http://localhost:3000/api/recibo/historial/${idCiudadano}`;

    try {
        const respuesta = await fetch(URL_API);
        
        if (!respuesta.ok) {
            throw new Error("Error al consultar el servidor.");
        }

        const recibos = await respuesta.json();

        // Si la API no devuelve ningún registro (Arreglo vacío)
        if (recibos.length === 0) {
            contenedor.innerHTML = `
                <p style="grid-column: 1/-1; color: #555; font-size: 16px; margin-top: 20px;">
                    Este ciudadano todavía no cuenta con recibos generados en el sistema.
                </p>`;
            return;
        }

        // Limpiamos la rejilla antes de pintar
        contenedor.innerHTML = "";

        // 3. Recorrer los recibos del usuario e inyectar las tarjetas
        recibos.forEach(recibo => {
            const tarjeta = document.createElement("div");
            tarjeta.classList.add("tarjeta-recibo");

            // Limpiar formato de la fecha de pago (Año-Mes-Día)
            const fechaPagoCorta = recibo.fecha_pago ? recibo.fecha_pago.split("T")[0] : "No registrada";

            tarjeta.innerHTML = `
                <div class="contenedor-miniatura" style="font-size: 60px; padding: 10px 0;">
                    📄
                </div>
                <div class="info-recibo">
                    <h3 style="font-size: 15px; margin-bottom: 5px;">RECIBO Nº ${recibo.numero_recibo}</h3>
                    <p style="font-size: 13px; color: #555; margin-bottom: 3px;"><b>Año:</b> ${recibo.anio}</p>
                    <p style="font-size: 13px; color: #555; margin-bottom: 8px;"><b>Fecha:</b> ${fechaPagoCorta}</p>
                    <p style="font-size: 16px; font-weight: bold; color: #1B4332; margin-bottom: 12px;">$${recibo.total}</p>
                    
                    <a href="../opc_Administrador/resivo_adm.html?id=${recibo.id_recibo}" target="_blank" class="btn-descargar">
                        Ver / Imprimir
                    </a>
                </div>
            `;

            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        console.error("Error en la renderización del historial:", error);
        contenedor.innerHTML = `
            <p style="grid-column: 1/-1; color: red; font-weight: bold;">
                No se pudo establecer conexión para recuperar el historial de cobros.
            </p>`;
    }
}