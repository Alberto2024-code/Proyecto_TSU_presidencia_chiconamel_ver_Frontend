document.addEventListener('DOMContentLoaded', () => {
    const formUsuario = document.getElementById('formUsuario');
    const inputNombre = document.getElementById('nombre');

    if (!formUsuario) {
        console.error('No se encontró el formulario formUsuario.');
        return;
    }

    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita recargar la página

        const nombreComunidad = inputNombre.value.trim().toUpperCase();

        if (!nombreComunidad) {
            alert('Por favor, ingresa un nombre válido para la comunidad.');
            return;
        }

        // Estructura JSON enviando la propiedad 'nombre_comunidad'
        const datosEnvio = {
            nombre_comunidad: nombreComunidad
        };

        const btnSubmit = formUsuario.querySelector('.btn-submit');
        const endpointCreate = '/api/comunidades/create_comunidad';

        const opcionesFetch = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEnvio)
        };

        let response;

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Guardando...';
            }

            try {
                // 💡 1. Primer intento: IP dinámica actual
                response = await fetch(`http://${window.location.hostname}:3000${endpointCreate}`, opcionesFetch);
            } catch (netError) {
                console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpointCreate}`, opcionesFetch);
            }

            if (!response) {
                throw new Error('No se obtuvo respuesta del servidor backend.');
            }

            const data = await response.json();

            if (response.ok) {
                alert('¡Comunidad guardada exitosamente!');
                formUsuario.reset();
                // Redireccionar al catálogo principal de comunidades
                window.location.href = '../../opc_Administrador/Comunidades_adm.html';
            } else {
                alert(`Atención: ${data.message || data.error || 'No se pudo guardar la comunidad.'}`);
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Guardar Comunidad';
                }
            }

        } catch (error) {
            console.error('❌ Error de conexión:', error);
            alert('Error al conectar con el servidor API o el servicio local está apagado.');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Guardar Comunidad';
            }
        }
    });
});