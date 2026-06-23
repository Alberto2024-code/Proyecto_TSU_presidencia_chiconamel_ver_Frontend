document.addEventListener('DOMContentLoaded', async () => {

    const urlParams = new URLSearchParams(window.location.search);
    // CORREGIDO: Ahora lee 'edit' (?edit=82) que es lo que manda tu URL
    const civilId = urlParams.get('edit'); 

    if (!civilId) {
        alert('Error: No se proporcionó un ID de ciudadano válido en la URL.');
        return;
    }

    // Guardamos el ID en el dataset del formulario para usarlo al enviar
    document.getElementById('formUsuario').dataset.id = civilId;

    // Cargamos primero el catálogo de comunidades y luego los datos del civil
    await cargarComunidades();
    await cargarDatosCivil(civilId);
});

// Función para cargar las comunidades en el select
async function cargarComunidades() {
    const selectComunidad = document.getElementById('comunidad');
    try {
        const response = await fetch('http://localhost:3000/api/comunidades/comunidades');
        const comunidades = await response.json();

        selectComunidad.innerHTML = '<option value="">-- Selecciona una Comunidad --</option>';
        comunidades.forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad.id_comunidad;
            option.textContent = comunidad.nombre_comunidad;
            selectComunidad.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar comunidades:', error);
        selectComunidad.innerHTML = '<option value="">Error al cargar comunidades</option>';
    }
}

// Función para recuperar los datos actuales del ciudadano y rellenar las cajas
async function cargarDatosCivil(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/civiles/civiles/${id}`);
        if (!response.ok) throw new Error('No se pudo obtener la información del ciudadano.');

        const civil = await response.json();

        // Rellenamos los inputs del HTML
        document.getElementById('nombre').value = civil.nombre || '';
        document.getElementById('apellido_paterno').value = civil.apellido_paterno || '';
        document.getElementById('apellido_materno').value = civil.apellido_materno || '';
        document.getElementById('domicilio').value = civil.domicilio || '';
        document.getElementById('cuenta-no').value = civil.cuenta_no || '';
        
        // CORREGIDO: Buscamos tanto '.curd' como '.Curd' por si las moscas con la base de datos
        document.getElementById('curd').value = civil.curd || civil.Curd || '';
        
        // Seleccionamos las opciones correctas en los dropdowns
        document.getElementById('tipo-servicio').value = (civil.tipo_servicio === "Domestico") ? "1" : "2";
        document.getElementById('estado').value = (civil.estado === "Activo") ? "1" : "2";
        document.getElementById('comunidad').value = civil.id_comunidad || '';

    } catch (error) {
        console.error('Error al cargar datos del civil:', error);
        alert('Hubo un problema al recuperar los datos actuales del ciudadano.');
    }
}

// Evento para enviar los datos modificados al servidor
document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = e.target.dataset.id;
    const nombre = document.getElementById('nombre').value.trim();
    const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
    const apellido_materno = document.getElementById('apellido_materno').value.trim();
    const domicilio = document.getElementById('domicilio').value.trim();
    const cuenta_no = document.getElementById('cuenta-no').value.trim();
    const curd = document.getElementById('curd').value.trim();
    const id_comunidad = document.getElementById('comunidad').value;

    if (!id_comunidad) {
        alert('Por favor, selecciona una comunidad válida.');
        return;
    }

    // Convertimos los valores numéricos del select a texto plano antes de enviar (como lo espera tu BD)
    const tipoServicioSelect = document.getElementById('tipo-servicio').value;
    const tipo_servicio = (tipoServicioSelect === "1") ? "Domestico" : "Comercial";

    const estadoSelect = document.getElementById('estado').value;
    const estado = (estadoSelect === "1") ? "Activo" : "Inactivo";

    // Empaquetamos el objeto JSON
    const civilModificado = {
        nombre,
        apellido_paterno,
        apellido_materno,
        domicilio,
        cuenta_no,
        tipo_servicio,
        estado,
        id_comunidad: parseInt(id_comunidad),
        curd
    };

    try {
        const response = await fetch(`http://localhost:3000/api/civiles/civiles/Update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(civilModificado)
        });

        const data = await response.json();

        // Validamos la respuesta exitosa
        if (response.ok) {
            alert('¡Los datos del civil se actualizaron con éxito!');
            window.location.href = '../../opc_Administrador/civilesDeComunidades.html';
        } else {
            alert(`Error: ${data.message || 'No se pudo actualizar el registro.'}`);
        }

    } catch (error) {
        console.error('Error en la petición de actualización (PUT):', error);
        alert('Hubo un error de conexión con el servidor. Revisa que tu backend esté encendido.');
    }
});