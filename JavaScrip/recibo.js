// 1. Función para inyectar los datos en el HTML
function cargarDatosRecibo(ciudadano) {
    if (!ciudadano) return;

    // Unimos nombre y apellidos limpiando los saltos de línea (\r\n) de la base de datos
    const nombreCompleto = `${ciudadano.nombre} ${ciudadano.apellido_paterno} ${ciudadano.apellido_materno || ''}`.replace(/\r?\n|\r/g, "").trim();
    
    // Formateamos la fecha de registro
    let dia = "--", mes = "--", anio = "--";
    if (ciudadano.fecha_registro) {
        const fecha = new Date(ciudadano.fecha_registro);
        dia = String(fecha.getDate()).padStart(2, '0');
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        mes = meses[fecha.getMonth()];
        anio = String(fecha.getFullYear()).slice(-2);
    }

    // Llenamos la información general en los elementos con ID
    document.getElementById('recibo-folio').innerText = `No. ${ciudadano.id_ciudadano || '--'}`;
    document.getElementById('fecha-dia').innerText = dia;
    document.getElementById('fecha-mes').innerText = mes;
    document.getElementById('fecha-anio').innerText = anio;
    
    document.getElementById('cliente-nombre').innerText = nombreCompleto;
    document.getElementById('cliente-domicilio').innerText = ciudadano.domicilio ? ciudadano.domicilio.replace(/\r?\n|\r/g, "").trim() : 'CONOCIDO';
    document.getElementById('recibo-mes-pago').innerText = mes.toUpperCase();
    document.getElementById('cliente-cuenta').innerText = ciudadano.cuenta_no || 'S/N';

    // Costo por tipo de servicio
    let costoDomestico = 0;
    let costoComercial = 0;

    if (ciudadano.tipo_servicio && ciudadano.tipo_servicio.toLowerCase().includes("domestico")) {
        costoDomestico = 60.00;
    } else if (ciudadano.tipo_servicio && ciudadano.tipo_servicio.toLowerCase().includes("comercial")) {
        costoComercial = 100.00; 
    }

    const totalAPagar = costoDomestico + costoComercial;

    // Llenamos la tabla de importes
    document.getElementById('imp-domestico').innerText = costoDomestico > 0 ? `$ ${costoDomestico.toFixed(2)}` : '$ 0.00';
    document.getElementById('imp-comercial').innerText = costoComercial > 0 ? `$ ${costoComercial.toFixed(2)}` : '$ 0.00';
    document.getElementById('imp-contrato').innerText = '$ 0.00';
    document.getElementById('imp-tomas').innerText = '$ 0.00';
    document.getElementById('imp-rezagos').innerText = '$ 0.00';
    document.getElementById('imp-recargos').innerText = '$ 0.00';
    document.getElementById('imp-iva').innerText = '$ 0.00';
    document.getElementById('imp-descuento').innerText = '$ 0.00';
    
    document.getElementById('imp-total').innerText = `$ ${totalAPagar.toFixed(2)}`;
    
    // Total a letras
    if (totalAPagar === 60) {
        document.getElementById('total-letras').innerText = "SESENTA PESOS 00/100 M.N.";
    } else if (totalAPagar === 100) {
        document.getElementById('total-letras').innerText = "CIEN PESOS 00/100 M.N.";
    } else {
        document.getElementById('total-letras').innerText = `${totalAPagar} PESOS 00/100 M.N.`;
    }
}

// 2. Escuchador principal que arranca al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    // Leemos los parámetros de la URL actual
    const urlParams = new URLSearchParams(window.location.search);
    const cuentaBuscada = urlParams.get('cuenta'); 
    let idComunidad = urlParams.get('comunidad'); // Intentamos leer la comunidad directamente de la URL

    if (!cuentaBuscada) {
        document.getElementById('cliente-nombre').innerText = 'Error: Cuenta no especificada';
        return;
    }

    // Si por alguna razón la URL no trae la comunidad, le asignamos la 2 (que es la de tu captura) para que no falle
    if (!idComunidad) {
        idComunidad = 2; 
    }

    // Llamamos exactamente a tu endpoint del backend de la captura
    const url = `http://localhost:3000/api/civiles/civiles/comunidad/${idComunidad}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('Error al conectar con la API');
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                // Buscamos al ciudadano que coincida exactamente con la cuenta_no de la URL
                const ciudadanoEncontrado = data.find(c => String(c.cuenta_no).trim() === String(cuentaBuscada).trim());
                
                if (ciudadanoEncontrado) {
                    cargarDatosRecibo(ciudadanoEncontrado);
                } else {
                    document.getElementById('cliente-nombre').innerText = `No se encontró la cuenta No. ${cuentaBuscada} en la comunidad ${idComunidad}`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('cliente-nombre').innerText = 'Error de servidor al cargar el recibo';
        });
});