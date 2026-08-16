// ==========================================
// 1. CARGA DINÁMICA DE DATOS (Al abrir la página)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const selectComunidad = document.getElementById('comunidad');
    const selectDomicilio = document.getElementById('domicilio'); // Capturamos el select de domicilio

    // --- CARGAR COMUNIDADES ---
    if (selectComunidad) {
        const endpointComunidades = '/api/comunidades/comunidades';
        let responseComunidades;

        try {
            // 💡 1. Primer intento: IP dinámica actual
            responseComunidades = await fetch(`http://${window.location.hostname}:3000${endpointComunidades}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                responseComunidades = await fetch(`http://localhost:3000${endpointComunidades}`);
            } catch (localError) {
                console.error('❌ Error crítico al cargar comunidades:', localError);
                selectComunidad.innerHTML = '<option value="">Error al cargar comunidades</option>';
            }
        }

        if (responseComunidades && responseComunidades.ok) {
            try {
                const comunidades = await responseComunidades.json();

                selectComunidad.innerHTML = '<option value="">-- Selecciona una Comunidad --</option>';

                comunidades.forEach(comunidad => {
                    const option = document.createElement('option');
                    option.value = comunidad.id_comunidad; 
                    option.textContent = comunidad.nombre_comunidad; 
                    selectComunidad.appendChild(option);
                });
            } catch (jsonError) {
                console.error('Error al procesar JSON de comunidades:', jsonError);
                selectComunidad.innerHTML = '<option value="">Error al procesar comunidades</option>';
            }
        }
    }

    // --- CARGAR DOMICILIOS DESDE LA API ---
    if (selectDomicilio) {
        const endpointDomicilios = '/api/civiles/domicilios';
        let responseDomicilios;

        try {
            // 💡 1. Primer intento: IP dinámica actual
            responseDomicilios = await fetch(`http://${window.location.hostname}:3000${endpointDomicilios}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                responseDomicilios = await fetch(`http://localhost:3000${endpointDomicilios}`);
            } catch (localError) {
                console.error('❌ Error crítico al cargar los domicilios:', localError);
                selectDomicilio.innerHTML = '<option value="">Error al cargar domicilios</option>';
            }
        }

        if (responseDomicilios && responseDomicilios.ok) {
            try {
                const domicilios = await responseDomicilios.json();

                selectDomicilio.innerHTML = '<option value="">-- Selecciona una Calle/Domicilio --</option>';

                domicilios.forEach(domicilio => {
                    const option = document.createElement('option');
                    option.value = domicilio.id_domicilio; // ID numérico en el value
                    option.textContent = domicilio.domicilio; // Nombre de la calle para el usuario
                    selectDomicilio.appendChild(option);
                });
            } catch (jsonError) {
                console.error('Error al procesar JSON de domicilios:', jsonError);
                selectDomicilio.innerHTML = '<option value="">Error al procesar domicilios</option>';
            }
        }
    }
});


// ==========================================
// 2. ENVÍO DEL FORMULARIO (Al dar clic en Guardar)
// ==========================================
const formUsuario = document.getElementById('formUsuario');

if (formUsuario) {
    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        try {
            // Recolectamos los valores de los inputs de texto
            const nombre           = document.getElementById('nombre').value.trim();
            const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
            const apellido_materno = document.getElementById('apellido_materno').value.trim();
            
            // Leemos el ID numérico del select de domicilios
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

            // Armamos el objeto con la estructura requerida
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

            const endpointIncert = '/api/civiles/Incert';
            const opcionesFetch = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoCivil)
            };

            let response;

            try {
                // 💡 1. Primer intento: IP dinámica actual
                response = await fetch(`http://${window.location.hostname}:3000${endpointIncert}`, opcionesFetch);
            } catch (netError) {
                console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpointIncert}`, opcionesFetch);
            }

            if (!response) {
                throw new Error('No se obtuvo respuesta del servidor backend.');
            }

            const data = await response.json();

            if (response.ok) {
                alert('¡Civil registrado con éxito!');
                formUsuario.reset(); 
                window.location.href = '../../opc_Administrador/menu-admin.html';
            } else {
                alert(`Error en el servidor: ${data.message || 'No se pudo registrar al ciudadano.'}`);
            }

        } catch (error) {
            console.error('❌ Error en la petición para insertar civil:', error);
            alert('Hubo un error de conexión con el servidor API o el backend local está apagado.');
        }
    });
}