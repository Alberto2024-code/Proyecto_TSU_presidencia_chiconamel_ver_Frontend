// ==========================================
// 1. CARGA DINÁMICA DE COMUNIDADES (Al abrir la página)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const selectComunidad = document.getElementById('comunidad');

    try {
        // Usamos tu URL exacta para traer las comunidades de la base de datos
        const response = await fetch('http://localhost:3000/api/comunidades/comunidades'); 
        const comunidades = await response.json();

        // Limpiamos el texto de espera "Cargando comunidades..."
        selectComunidad.innerHTML = '<option value="">-- Selecciona una Comunidad --</option>';

        // Recorremos el resultado de tu base de datos y lo metemos al select
        comunidades.forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad.id_comunidad; // El ID de la comunidad
            option.textContent = comunidad.nombre_comunidad; // El nombre que verá el usuario
            
            selectComunidad.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar las comunidades desde la URL:', error);
        selectComunidad.innerHTML = '<option value="">Error al cargar comunidades</option>';
    }
});


// ==========================================
// 2. ENVÍO DEL FORMULARIO (Al dar clic en Guardar)
// ==========================================
document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitamos que la página recargue sola

    // 1. Recolectamos los valores de los inputs del HTML
    const nombre = document.getElementById('nombre').value.trim();
    const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
    const apellido_materno = document.getElementById('apellido_materno').value.trim();
    const domicilio = document.getElementById('domicilio').value.trim();
    const cuenta_no = document.getElementById('cuenta-no').value.trim();
    const curd = document.getElementById('curd').value.trim();

    // CORRECCIÓN: Capturamos el valor real del select de comunidades en lugar del "1" fijo
    const id_comunidad = document.getElementById('comunidad').value;

    // Validación para obligar al usuario a elegir una comunidad de la lista
    if (!id_comunidad) {
        alert('Por favor, selecciona una comunidad válida.');
        return;
    }

    // 2. Traducimos las opciones numéricas a texto plano para tu base de datos
    const tipoServicioSelect = document.getElementById('tipo-servicio').value;
    const tipo_servicio = (tipoServicioSelect === "1") ? "Domestico" : "Comercial";

    const estadoSelect = document.getElementById('estado').value;
    const estado = (estadoSelect === "1") ? "Activo" : "Inactivo";

    // 3. Armamos el objeto con los nombres de variables que espera tu Backend
    const nuevoCivil = {
        nombre,
        apellido_paterno,
        apellido_materno,
        domicilio,
        cuenta_no,
        tipo_servicio,
        estado,
        id_comunidad: parseInt(id_comunidad), // Pasamos el ID dinámico como entero
        curd 
    };

    try {
        // 4. Hacemos la petición POST a tu ruta de insertar civiles
        const response = await fetch('http://localhost:3000/api/civiles/Incert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoCivil)
        });

        const data = await response.json();

        // 5. Verificamos la respuesta
        if (response.ok) {
            alert('¡Civil registrado con éxito!');
            document.getElementById('formUsuario').reset(); // Resetea el formulario
            window.location.href = '../../opc_Administrador/menu-admin.html';
        } else {
            alert(`Error: ${data.message || 'No se pudo registrar al civil.'}`);
        }

    } catch (error) {
        console.error('Error en la petición para insertar civil:', error);
        alert('Hubo un error de conexión con el servidor.');
    }
});