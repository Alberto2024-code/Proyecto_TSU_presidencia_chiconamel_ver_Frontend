// ==========================================
// 1. CARGA DINÁMICA DE COMUNIDADES (Al abrir la página)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const selectComunidad = document.getElementById('comunidad');

    try {
        // Usamos tu URL exacta para traer las comunidades
        const response = await fetch('http://localhost:3000/api/comunidades/comunidades'); 
        const comunidades = await response.json();

        // Limpiamos el texto de espera
        selectComunidad.innerHTML = '<option value="">-- Selecciona una Comunidad --</option>';

        // Recorremos el resultado de tu base de datos y lo metemos al select
        comunidades.forEach(comunidad => {
            const option = document.createElement('option');
            // Guardamos el ID real en el value
            option.value = comunidad.id_comunidad; 
            // Mostramos el nombre en la interfaz de usuario
            option.textContent = comunidad.nombre_comunidad; 
            
            selectComunidad.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar las comunidades:', error);
        selectComunidad.innerHTML = '<option value="">Error al cargar comunidades</option>';
    }
});


// ==========================================
// 2. ENVÍO DEL FORMULARIO (Al dar clic en Guardar)
// ==========================================
document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitamos que la página se recargue solo

    // Capturamos los datos de los inputs del HTML
    const nombre = document.getElementById('nombre').value.trim();
    const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
    const apellido_materno = document.getElementById('apellido_materno').value.trim();
    const domicilio = document.getElementById('domicilio').value.trim();
    const cuenta_no = document.getElementById('cuenta-no').value.trim();
    const curd = document.getElementById('curd').value.trim();

    // Capturamos la comunidad seleccionada del select dinámico
    const id_comunidad = document.getElementById('comunidad').value;

    // Validación: que no mande el formulario si no ha seleccionado una comunidad válida
    if (!id_comunidad) {
        alert('Por favor, selecciona una comunidad válida.');
        return;
    }

    // Traducimos los valores de los selects de tu HTML a texto plano para tu base de datos
    const tipoServicioSelect = document.getElementById('tipo-servicio').value;
    const tipo_servicio = (tipoServicioSelect === "1") ? "Domestico" : "Comercial";

    const estadoSelect = document.getElementById('estado').value;
    const estado = (estadoSelect === "1") ? "Activo" : "Inactivo";

    // Armamos el objeto final JSON listo para tu Backend
    const nuevoCivil = {
        nombre,
        apellido_paterno,
        apellido_materno,
        domicilio,
        cuenta_no,
        tipo_servicio,
        estado,
        id_comunidad: parseInt(id_comunidad), // Lo mandamos como un número entero
        curd
    };

    try {
        // Enviamos los datos mediante POST a tu API de civiles
        const response = await fetch('http://localhost:3000/api/civiles/Incert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoCivil)
        });

        const data = await response.json();

        if (response.ok) {
            alert('¡Civil registrado con éxito!');
            document.getElementById('formUsuario').reset(); // Limpia los campos
            
            // Redireccionamos a donde prefieras (por ejemplo, al menú de administración)
            window.location.href = '../../opc_Administrador/menu-admin.html';
        } else {
            alert(`Error: ${data.message || 'No se pudo guardar el registro.'}`);
        }

    } catch (error) {
        console.error('Error en la petición POST:', error);
        alert('Hubo un error de conexión. Asegúrate de que el backend esté encendido.');
    }
});