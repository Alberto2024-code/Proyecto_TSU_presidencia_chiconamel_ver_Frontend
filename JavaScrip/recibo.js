document.addEventListener("DOMContentLoaded", () => {

    const urlParams = new URLSearchParams(window.location.search);
    const idRecibo = urlParams.get('id');

    if (!idRecibo) {
        console.error("No se encontró ningún ID de recibo en la URL");
        return;
    }


    obtenerDatosRecibo(idRecibo);
});

async function obtenerDatosRecibo(id) {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/recibo/get/${id}`);
        
        if (!respuesta.ok) {
            throw new Error("No se pudo obtener la respuesta del servidor");
        }

        const recibo = await respuesta.json();

        if (!recibo) {
            alert("No se encontraron los datos de este recibo");
            return;
        }

     
        document.getElementById("recibo-folio").innerText = `No. ${recibo.numero_recibo || '--'}`;
        document.getElementById('cliente-nombre').textContent = `${recibo.nombre} ${recibo.apellido_paterno} ${recibo.apellido_materno || ''}`.toUpperCase();
        document.getElementById("cliente-domicilio").textContent = `${recibo.domicilio} ${'   ,'} ${recibo.nombre_comunidad}`;
        document.getElementById("cliente-cuenta").innerText = recibo.cuenta_no || '--';
        document.getElementById("recibo-mes-pago").innerText = `${recibo.mes_pagado ? recibo.mes_pagado.split("T")[0] : 'Generado'} / ${recibo.anio || '2026'}`;
        document.getElementById("total-letras").innerText = recibo.importe_letra || "CERO PESOS 00/100 M.N.";

        if (recibo.nombre_servicio === "Domestico") {
            document.getElementById("imp-domestico").innerText = `$ ${recibo.total || '0.00'}`;
            document.getElementById("imp-comercial").innerText = `$ 0.00`;
        } else {
            document.getElementById("imp-comercial").innerText = `$ ${recibo.contrato || '0.00'}`;
            document.getElementById("imp-domestico").innerText = `$ 0.00`;
        }

       
        document.getElementById("imp-contrato").innerText = `$ ${recibo.contrato || '0.00'}`;
        document.getElementById("imp-tomas").innerText = `$ ${recibo.tomas_agua || '0.00'}`;
        document.getElementById("imp-rezagos").innerText = `$ ${recibo.rezagos || '0.00'}`;
        document.getElementById("imp-recargos").innerText = `$ 0.00`;
        document.getElementById("imp-iva").innerText = `$ ${recibo.iva || '0.00'}`;
        document.getElementById("imp-descuento").innerText = `$ ${recibo.descuentos || '0.00'}`;
        
       
        document.getElementById("imp-total").innerText = `$ ${recibo.total || '0.00'}`;

       
        if (recibo.fecha_pago) {
          
            const partesFecha = recibo.fecha_pago.split("T")[0].split("-"); 
            const anioCorto = partesFecha[0].substring(2); // Toma el "26" de "2026"
            const mesNumero = partesFecha[1];
            const dia = partesFecha[2];

            const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            const nombreMes = meses[parseInt(mesNumero) - 1] || mesNumero;

          
            document.getElementById("fecha-dia").innerText = dia;
            document.getElementById("fecha-mes").innerText = nombreMes;
            document.getElementById("fecha-anio").innerText = anioCorto;
        }

    } catch (error) {
        console.error("Error al renderizar los datos del recibo en la web:", error);
    }
}