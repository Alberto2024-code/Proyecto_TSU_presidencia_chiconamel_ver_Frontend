// =========================================================================
// 1. FUNCIONALIDAD DEL BOTÓN DEL OJITO (MOSTRAR/OCULTAR CONTRASEÑA CON SVG LOCAL)
// =========================================================================
const btnTogglePassword = document.getElementById('btn-toggle-password');
const inputPassword = document.getElementById('input-password');

// Definición de SVG vectoriales locales
const svgOjoAbierto = `<svg xmlns="../imagenes/ojo_abierto.jpg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const svgOjoCerrado = `<svg xmlns="../imagenes/ojo_cerrado.jpg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

if (btnTogglePassword && inputPassword) {
    // Icono inicial: Ojo tachado/cerrado
    btnTogglePassword.innerHTML = svgOjoCerrado;

    btnTogglePassword.addEventListener('click', function () {
        // Cambiamos el tipo de input y el SVG
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnTogglePassword.innerHTML = svgOjoAbierto; 
        } else {
            inputPassword.type = 'password';
            btnTogglePassword.innerHTML = svgOjoCerrado; 
        }
    });
}

// =========================================================================
// 2. CONTROL DEL FORMULARIO DE INICIO DE SESIÓN CON RESPALDO EN LOCALHOST
// =========================================================================
const formLogin = document.getElementById('login');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Mapeamos con las IDs reales de tu Login HTML
        const inputUser = document.getElementById('usuario') || document.getElementById('input-username');
        const inputPass = document.getElementById('input-password');
        const selectRol = document.getElementById('rol') || document.getElementById('select-rol');

        if (!inputUser || !inputPass || !selectRol) {
            console.error("Falla Crítica: No se encontraron los elementos input en el HTML.");
            alert("Error interno en la interfaz del formulario.");
            return;
        }

        const usernameForm = inputUser.value.trim();
        const passwordForm = inputPass.value.trim();
        const rolForm      = selectRol.value.trim(); 

        if (!usernameForm || !passwordForm || !rolForm) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        const endpointLogin = '/api/auth/login';
        const payload = JSON.stringify({ 
            usuario: usernameForm, 
            contrasena: passwordForm,
            rol: rolForm
        });

        let response;

        try {
            // 💡 1. Primer intento: Usando la IP dinámica actual
            response = await fetch(`http://${window.location.hostname}:3000${endpointLogin}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
        } catch (netError) {
            console.warn("⚠️ Falló el login por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpointLogin}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                });
            } catch (localError) {
                console.error('❌ Error crítico al conectar con el servidor:', localError);
                alert('Error de conexión con el backend. Asegúrate de que el servidor de Node.js esté ejecutándose.');
                return;
            }
        }

        try {
            const datos = await response.json();

            if (response && response.ok) {
                // 🌟 Extraemos el ID dinámico desde el objeto usuario
                const idReal = datos.usuario?.id_usuario || datos.usuario?.id || datos.id_usuario;

                // 1. Guardamos los datos correctamente en el localStorage
                localStorage.setItem('token', datos.token);
                localStorage.setItem('id_usuario', idReal); // Guarda el ID del usuario activo
                localStorage.setItem('usuario', JSON.stringify(datos.usuario)); 
                localStorage.setItem('usuarioNombre', datos.usuario.nombre);
                localStorage.setItem('usuarioRol', datos.usuario.rol);

                alert(`¡Bienvenido al sistema, ${datos.usuario.nombre}!`);
                
                // 2. Redirección basada en los datos reales del usuario
                const rolUsuario = datos.usuario.rol;

                if (rolUsuario == 1 || rolUsuario === "Administrador") {
                    window.location.href = "../opc_Administrador/menu-admin.html"; 
                } else if (rolUsuario == 2 || rolUsuario === "Usuario" || rolUsuario === "Empleado") {
                    window.location.href = "../html/menu.html"; 
                }

            } else {
                localStorage.clear();
                alert(datos.message || 'Usuario o contraseña incorrectos. Inténtalo de nuevo.');
            }

        } catch (error) {
            console.error('Error procesando respuesta del login:', error);
            alert('Error al procesar la respuesta del servidor.');
        }
    });
}