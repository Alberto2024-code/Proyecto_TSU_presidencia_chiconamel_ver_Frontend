// =========================================================================
// 1. FUNCIONALIDAD DEL BOTÓN DEL OJITO (MOSTRAR/OCULTAR CONTRASEÑA)
// =========================================================================
const btnTogglePassword = document.getElementById('btn-toggle-password');
const inputPassword = document.getElementById('input-password');

if (btnTogglePassword && inputPassword) {
    btnTogglePassword.addEventListener('click', function () {
        // Cambiamos el tipo de input
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnTogglePassword.textContent = '🤫'; 
        } else {
            inputPassword.type = 'password';
            btnTogglePassword.textContent = '👁️'; 
        }
    });
}

// =========================================================================
// 2. CONTROL DEL FORMULARIO DE INICIO DE SESIÓN CORREGIDO
// =========================================================================
document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 🚀 CORRECCIÓN DE IDs: Mapeamos con las IDs reales de tu Login HTML
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

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                usuario: usernameForm, 
                contrasena: passwordForm,
                rol: rolForm
            })
        });

        const datos = await response.json();

        if (response.ok) {
            // 1. Guardamos los nuevos datos limpitos
            localStorage.setItem('token', datos.token);
            localStorage.setItem('id_usuario',datos.id_usuario); 
            localStorage.setItem('usuario', JSON.stringify(datos.usuario)); 
            localStorage.setItem('usuarioNombre', datos.usuario.nombre);
            localStorage.setItem('usuarioRol', datos.usuario.rol);

            alert(`¡Bienvenido al sistema, ${datos.usuario.nombre}!`);
            
            // 2. Redirección basada EN LOS DATOS REALES que acaban de llegar exitosamente
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
        console.error('Error al conectar con el servidor:', error);
        alert('Error de conexión con el backend.');
    }
});