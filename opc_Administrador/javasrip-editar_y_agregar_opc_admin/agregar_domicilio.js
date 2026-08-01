document.addEventListener('DOMContentLoaded', () => {
    const formUsuario = document.getElementById('formUsuario');
    const inputNombre = document.getElementById('nombre');

    if (!formUsuario) {
        console.error('No se encontró el formulario formUsuario.');
        return;
    }

    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita recargar la página

        const domicilio = inputNombre.value.trim().toUpperCase();

        if (!domicilio) {
            alert('Por favor, ingresa un nombre válido para el domicilio.');
            return;
        }

        // Estructura JSON enviando la propiedad 'domicilio'
        const datosEnvio = {
            domicilio: domicilio
        };

        const btnSubmit = formUsuario.querySelector('.btn-submit');

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Guardando...';
            }

            // Petición POST al endpoint de creación
            const response = await fetch('http://localhost:3000/api/comunidades/create_domicilio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosEnvio)
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Domicilio guardado exitosamente!');
                formUsuario.reset();
                // Redireccionar al catálogo principal de domicilios
                window.location.href = '../../opc_Administrador/Comunidades_adm.html';
            } else {
                alert(`Atención: ${data.message || data.error || 'No se pudo guardar el domicilio.'}`);
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Guardar Domicilio';
                }
            }

        } catch (error) {
            console.error('Error de conexión:', error);
            alert('Error al conectar con el servidor API.');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Guardar Domicilio';
            }
        }
    });
});