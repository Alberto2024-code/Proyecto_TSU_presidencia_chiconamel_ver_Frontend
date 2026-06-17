document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usernameForm = document.getElementById('input-username').value.trim();
    const passwordForm = document.getElementById('input-password').value.trim();
    const rolForm = document.getElementById('selectRol').value.trim();

    try {
        const response = await fetch('http://localhost:3000/api/usuarios/');
        const usuarios = await response.json();
        const usuarioEncontrado = usuarios.find(u => 
            u.usuario === usernameForm && 
            u.password === passwordForm && 
            u.nombre_rol === rolForm
        );

        if (usuarioEncontrado) {
            if (usuarioEncontrado.estado !== "Activo") {
                alert('Usuario inactivo. Contacta al administrador.');
                return;
            }
            
            alert(`¡Bienvenido, ${usuarioEncontrado.nombre}!`);
            
            localStorage.setItem('usuario', JSON.stringify(usuarioEncontrado));
            
            // ==========================================
            // GESTIÓN DE RUTAS POR ROL (1 o 2)
            // ==========================================
            if (Number(usuarioEncontrado.rol) === 1) {
                // Si el rol es 1 (Administrador)
                window.location.href = "../opc_Administrador/menu-admin.html"; 
            } else if (Number(usuarioEncontrado.rol) === 2) {
                // Si el rol es 2 (Empleado)
                window.location.href = "../html/menu.html"; 
            } else {
                // Por si acaso hay algún otro rol en tu base de datos
                window.location.href = "../html/menu.html"; 
            }

        } else {
            alert('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
        }
    } catch (error) {
        console.error('Error al conectar con el servidor:', error);
        alert('Error de conexión. Por favor, asegúrate de que el backend de Node.js esté encendido.');
    }
});
