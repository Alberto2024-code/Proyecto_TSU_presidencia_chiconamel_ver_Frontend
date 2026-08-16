// Obtener elementos del DOM
const btnRestaurar = document.getElementById('btn-restaurar');
const inputSql = document.getElementById('input-sql');

// 1. Al dar clic al botón "Restaurar", simular clic en el input de archivo
if (btnRestaurar && inputSql) {
    btnRestaurar.addEventListener('click', () => {
        inputSql.click();
    });

    // 2. Cuando el usuario selecciona un archivo .sql
    inputSql.addEventListener('change', async () => {
        const archivo = inputSql.files[0];
        
        // Si canceló la selección de archivo, no hacer nada
        if (!archivo) return;

        // Confirmación de seguridad (¡Muy importante!)
        const confirmar = confirm(`⚠️ ATENCIÓN: Se van a reemplazar todos los datos de la base de datos con el archivo:\n\n"${archivo.name}"\n\n¿Estás seguro de continuar?`);
        
        if (!confirmar) {
            inputSql.value = ''; // Limpiar la selección
            return;
        }

        // Preparar el archivo en un FormData para enviarlo por HTTP POST
        const formData = new FormData();
        formData.append('archivo_sql', archivo);

        const endpointRestaurar = '/api/respaldo/restaurar';
        const textoOriginal = btnRestaurar.innerText;
        let response;

        try {
            // Feedback visual
            btnRestaurar.disabled = true;
            btnRestaurar.innerText = '⏳ Restaurando...';

            try {
                // 💡 1. Primer intento: IP dinámica actual
                response = await fetch(`http://${window.location.hostname}:3000${endpointRestaurar}`, {
                    method: 'POST',
                    body: formData
                });
            } catch (netError) {
                console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpointRestaurar}`, {
                    method: 'POST',
                    body: formData
                });
            }

            if (!response) {
                throw new Error('No se pudo establecer respuesta con el servidor backend');
            }

            const data = await response.json();

            if (response.ok) {
                alert('🎉 ¡Base de datos restaurada con éxito!');
                window.location.reload(); // Recargar la página para ver los datos actualizados
            } else {
                alert('❌ Error: ' + (data.mensaje || 'No se pudo restaurar la base de datos'));
            }

        } catch (error) {
            console.error('❌ Error al restaurar la base de datos:', error);
            alert('❌ Error crítico de conexión. Verifica que el servidor backend de Node.js esté activo.');
        } finally {
            // Restaurar estado original del botón e input
            btnRestaurar.disabled = false;
            btnRestaurar.innerText = textoOriginal || '🔄 Restaurar Respaldo (.sql)';
            inputSql.value = ''; // Limpiar el input para permitir elegir el mismo u otro archivo después
        }
    });
}