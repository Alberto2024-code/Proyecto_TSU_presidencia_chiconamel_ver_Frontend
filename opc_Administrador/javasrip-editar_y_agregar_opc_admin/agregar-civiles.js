// ==========================================
// 1. CARGA DINÁMICA DE DATOS (Al abrir la página)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const selectComunidad = document.getElementById('comunidad');
    const selectDomicilio = document.getElementById('domicilio'); // <-- Capturamos el nuevo select

    // --- CARGAR COMUNIDADES ---
    if (selectComunidad) {
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
            console.error('Error al cargar las comunidades:', error);
            selectComunidad.innerHTML = '<option value="">Error al cargar comunidades</option>';
        }
    }

    // --- 🛠️ NUEVO: CARGAR DOMICILIOS DESDE TU API ---
    if (selectDomicilio) {
        try {
            const response = await fetch('http://localhost:3000/api/civiles/domicilios'); 
            const domicilios = await response.json();

            selectDomicilio.innerHTML = '<option value="">-- Selecciona una Calle/Domicilio --</option>';

            domicilios.forEach(domicilio => {
                const option = document.createElement('option');
                option.value = domicilio.id_domicilio; // Mandamos el ID numérico al value
                option.textContent = domicilio.domicilio; // Lo que lee el usuario (ej: 5 DE MAYO)
                selectDomicilio.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar los domicilios:', error);
            selectDomicilio.innerHTML = '<option value="">Error al cargar domicilios</option>';
        }
    }
});


// ==========================================
// 2. ENVÍO DEL FORMULARIO (Al dar clic en Guardar)
// ==========================================
document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    try {
        // Recolectamos los valores de los inputs de texto
        const nombre           = document.getElementById('nombre').value.trim();
        const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
        const apellido_materno = document.getElementById('apellido_materno').value.trim();
        
        // 🎯 CAMBIO AQUÍ: Ahora leemos el ID numérico del select de domicilios
        const id_domicilio     = document.getElementById('domicilio').value;

        // Buscamos el input del número de cuenta
        const inputCuenta      = document.getElementById('cuenta-no') || document.getElementById('cuenta_no');
        const cuenta_no        = inputCuenta ? inputCuenta.value.trim() : '';

        // Capturamos el ID de la comunidad seleccionada
        const id_comunidad     = document.getElementById('comunidad').value;

        // Validaciones defensivas en Frontend
        if (!id_domicilio) {
            alert('Por favor, selecciona un domicilio válido.');
            return;
        }
        if (!id_comunidad) {
            alert('Por favor, selecciona una comunidad válida.');
            return;
        }

        // Conversión a enteros para las llaves foráneas correspondientes
        const tipoServicioSelect = document.getElementById('tipo-servicio') || document.getElementById('tipo_servicio');
        const tipo_servicio      = parseInt(tipoServicioSelect.value); 

        const estadoSelect       = document.getElementById('estado');
        const estado             = (estadoSelect?.value === "1" || estadoSelect?.value === "Activo") ? "Activo" : "Inactivo";

        // Armamos el objeto con la estructura que tu controlador necesita
        // (Nota: Usamos 'domicilio' aquí para que encaje directo con el truco 'domicilio: id_domicilio' de tu backend)
        const nuevoCivil = {
            nombre,
            apellido_paterno,
            apellido_materno,
            domicilio: parseInt(id_domicilio), // Enviamos el ID numérico casteado
            cuenta_no,
            tipo_servicio, 
            estado,
            id_comunidad: parseInt(id_comunidad) 
        };

        // Hacemos la petición POST a tu ruta de insertar civiles
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
            document.getElementById('formUsuario').reset(); 
            window.location.href = '../../opc_Administrador/menu-admin.html';
        } else {
            alert(`Error en el servidor: ${data.message || 'No se pudo registrar al ciudadano.'}`);
        }

    } catch (error) {
        console.error('Error en la petición para insertar civil:', error);
        alert('Hubo un error de conexión con el servidor. Revisa la consola.');
    }
});