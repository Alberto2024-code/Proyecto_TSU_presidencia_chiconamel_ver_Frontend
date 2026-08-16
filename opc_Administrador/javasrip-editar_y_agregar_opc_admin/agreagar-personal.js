const btnTogglePassword = document.getElementById('btn-toggle-password');
const inputPassword = document.getElementById('input-password');

if (btnTogglePassword && inputPassword) {
    btnTogglePassword.addEventListener('click', function () {
        // Cambiamos el tipo de input
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnTogglePassword.textContent = '🤓'; 
        } else {
            inputPassword.type = 'password';
            btnTogglePassword.textContent = '👁️'; 
        }
    });
}

// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const formUsuario = document.getElementById('formUsuario');

    if (!formUsuario) {
        console.error("Falla Crítica: No se encontró el formulario #formUsuario en el DOM.");
        return;
    }

    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const endpointInsert = '/api/usuarios/incert';

        try {
            // Mapeo exacto basado en las IDs reales de tu archivo HTML
            const nombre           = document.getElementById('nombre').value.trim();
            const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
            const apellido_materno = document.getElementById('apellido_materno').value.trim();
            const nombre_usuario   = document.getElementById('usuario').value.trim(); 
            const contrasenia      = document.getElementById('input-password').value.trim(); 
            const id_rol           = parseInt(document.getElementById('rol').value.trim());   
            const estado           = document.getElementById('estado').value;          

            const nuevoUsuario = {
                nombre: nombre,
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno, 
                usuario: nombre_usuario,  
                password: contrasenia,   
                rol: id_rol,             
                estado: estado
            };

            const opcionesFetch = {
                method: 'POST',          
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoUsuario)
            };

            let response;

            try {
                // 💡 1. Primer intento: IP dinámica actual
                response = await fetch(`http://${window.location.hostname}:3000${endpointInsert}`, opcionesFetch);
            } catch (netError) {
                console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpointInsert}`, opcionesFetch);
            }

            if (!response) {
                throw new Error('No se obtuvo respuesta del servidor backend.');
            }

            // Validamos que el servidor haya devuelto un formato JSON antes de usar .json()
            let data = {};
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const textoPlano = await response.text();
                data = { message: textoPlano || 'Error desconocido en el servidor.' };
            }

            if (response.ok) {
                alert('¡Personal registrado con éxito en el sistema!');
                formUsuario.reset(); // Limpieza del DOM del formulario
                
                // Redireccionamos al catálogo de usuarios
                window.location.href = '../../opc_Administrador/usuarios.html';
            } else {
                alert(`Error en el servidor: ${data.message || 'No se pudo guardar el usuario.'}`);
            }

        } catch (error) {
            console.error('❌ Falla crítica en la petición de inserción:', error);
            alert('Hubo un error de conexión con la API o el servidor local está apagado.');
        }
    });
});