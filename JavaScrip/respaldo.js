document.addEventListener('DOMContentLoaded', () => {
    const btnRespaldo = document.getElementById('btn-respaldo');

    if (btnRespaldo) {
        btnRespaldo.addEventListener('click', async () => {
            const endpointRespaldo = '/api/respaldo/descargar';
            const textoOriginal = btnRespaldo.innerHTML;
            let response;

            try {
                btnRespaldo.disabled = true;
                btnRespaldo.innerHTML = '⏳ Generando respaldo...';

                try {
                    // 💡 1. Primer intento: IP dinámica actual
                    response = await fetch(`http://${window.location.hostname}:3000${endpointRespaldo}`);
                } catch (netError) {
                    console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
                    // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                    response = await fetch(`http://localhost:3000${endpointRespaldo}`);
                }

                if (!response || !response.ok) {
                    throw new Error('Error al conectar con el servidor backend');
                }

                // Crear enlace temporal de descarga del blob (.sql)
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `respaldo_sistema_agua_${new Date().toISOString().split('T')[0]}.sql`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Respaldo Exitoso!',
                        text: 'La base de datos se ha descargado correctamente.',
                        confirmColor: '#198754'
                    });
                } else {
                    alert('¡Respaldo descargado correctamente!');
                }

            } catch (error) {
                console.error('❌ Error al generar el respaldo:', error);
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de respaldo',
                        text: 'No se pudo generar el archivo .sql. Verifica que el servidor backend de Node.js esté activo.',
                        confirmColor: '#dc3545'
                    });
                } else {
                    alert('Ocurrió un error al intentar descargar el respaldo. Verifica la conexión con el servidor.');
                }
            } finally {
                btnRespaldo.disabled = false;
                btnRespaldo.innerHTML = textoOriginal || '💾 Descargar Respaldo (.sql)';
            }
        });
    }
});