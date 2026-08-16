// ==========================================
// FUNCIÓN AUXILIAR CON TOLERANCIA A FALLOS (Host/IP -> Localhost)
// ==========================================
async function fetchConFallback(endpoint, opciones = {}) {
    try {
        // 💡 1. Primer intento: Host/IP dinámica detectada en la URL
        return await fetch(`http://${window.location.hostname}:3000${endpoint}`, opciones);
    } catch (netError) {
        console.warn(`⚠️ Falló la conexión por IP/Red (${endpoint}). Intentando fallback a localhost...`);
        // 🔄 2. Segundo intento (Respaldo sin red local): localhost
        return await fetch(`http://localhost:3000${endpoint}`, opciones);
    }
}

// ==========================================
// 1. INICIALIZACIÓN Y CONFIGURACIÓN DEL CONTEXTO
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID de la tarifa desde los parámetros de la URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    const tarifaId = urlParams.get('id');

    if (!tarifaId) {
        alert('Error: No se proporcionó un ID de tarifa válido en la URL.');
        return;
    }

    // 2. Cargar los datos actuales de la tarifa para rellenar el formulario
    await obtenerDatosTarifa(tarifaId);

    // ==========================================
    // VALIDACIÓN DE FECHAS EN EL FRONT-END
    // ==========================================
    const fechaInicioInput = document.getElementById('fecha_inicio');
    const fechaTerminoInput = document.getElementById('fecha_termino');

    function validarFechas() {
        const fechaInicioVal = fechaInicioInput.value;
        if (fechaInicioVal) {
            // Ponemos el valor mínimo permitido a la fecha de término
            fechaTerminoInput.min = fechaInicioVal;

            // Si la fecha de término actual es menor que la de inicio, la borramos para evitar datos inválidos
            if (fechaTerminoInput.value && fechaTerminoInput.value < fechaInicioVal) {
                fechaTerminoInput.value = '';
            }
        } else {
            // Si limpian la fecha de inicio, quitamos la restricción mínima
            fechaTerminoInput.removeAttribute('min');
        }
    }

    // Escuchamos cuando el usuario cambia la fecha de inicio manualmente
    fechaInicioInput.addEventListener('change', validarFechas);

    // También lo ejecutamos al cargar los datos por si ya vienen fechas de la base de datos
    validarFechas();
    // ==========================================

    // 3. Escuchar el evento de envío del formulario para actualizar
    const formulario = document.getElementById('form-tarifas');
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validación extra antes de enviar por si acaso
            if (fechaInicioInput.value && fechaTerminoInput.value && fechaTerminoInput.value < fechaInicioInput.value) {
                alert('La fecha de término de la promoción no puede ser menor a la fecha de inicio.');
                return;
            }

            await actualizarTarifa(tarifaId);
        });
    }
});

// ==========================================
// 2. CARGA DE DATOS ORIGINALES EN EL FORMULARIO
// ==========================================
async function obtenerDatosTarifa(id) {
    try {
        const response = await fetchConFallback(`/api/tarifas/${id}`);
        
        if (!response || !response.ok) {
            if (response && response.status === 404) {
                throw new Error(`La tarifa con el ID ${id} no existe en la base de datos.`);
            } else {
                throw new Error(`El servidor respondió con un error (Código: ${response ? response.status : 'Sin Respuesta'}).`);
            }
        }

        const tarifa = await response.json();

        if (!tarifa || tarifa.error) {
            throw new Error(tarifa.error || 'Estructura de tarifa inválida.');
        }

        document.getElementById('tipo_servicio').value = tarifa.tipo_servicio || 'Domestico';
        document.getElementById('anio').value = tarifa.anio || 2026;
        document.getElementById('monto').value = tarifa.monto || '';
        document.getElementById('monto_descuento').value = tarifa.monto_descuento || '0.00';
        document.getElementById('promocion_name').value = tarifa.promocion_nombre || '';
        
        if (tarifa.fecha_inicio) {
            document.getElementById('fecha_inicio').value = tarifa.fecha_inicio.split('T')[0];
        }
        if (tarifa.fecha_termino) {
            document.getElementById('fecha_termino').value = tarifa.fecha_termino.split('T')[0];
        }

        // AGREGADO: Forzamos la validación una vez que los campos se llenaron con los datos de la API
        const fechaInicioInput = document.getElementById('fecha_inicio');
        const fechaTerminoInput = document.getElementById('fecha_termino');
        if (fechaInicioInput && fechaInicioInput.value) {
            fechaTerminoInput.min = fechaInicioInput.value;
        }
        
    } catch (error) {
        console.error('Error al precargar la tarifa:', error);
        alert(`Error al cargar datos: ${error.message}`);
    }
}

// ==========================================
// 3. PERSISTENCIA: ENVÍO DE ACTUALIZACIÓN (PUT)
// ==========================================
async function actualizarTarifa(id) {
    const datosModificados = {
        tipo_servicio: document.getElementById('tipo_servicio').value,
        monto: parseFloat(document.getElementById('monto').value),
        anio: parseInt(document.getElementById('anio').value),
        monto_descuento: parseFloat(document.getElementById('monto_descuento').value || 0),
        fecha_inicio: document.getElementById('fecha_inicio').value || null,
        fecha_termino: document.getElementById('fecha_termino').value || null,
        promocion_nombre: document.getElementById('promocion_name').value || ''
    };

    const botonGuardar = document.querySelector('.btn-guardar');

    try {
        if (botonGuardar) {
            botonGuardar.disabled = true;
            botonGuardar.textContent = 'Actualizando...';
        }

        const response = await fetchConFallback(`/api/tarifas/Update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosModificados)
        });

        if (!response) {
            throw new Error('No se obtuvo respuesta del servidor backend.');
        }

        const respuestaServidor = await response.json();

        if (response.ok) {
            alert('¡La tarifa se ha actualizado correctamente en el sistema!');
            window.location.href = '../../opc_Administrador/tipo_servicio_adm.html';
        } else {
            alert(`Error: ${respuestaServidor.message || 'No se pudo actualizar la tarifa.'}`);
            if (botonGuardar) {
                botonGuardar.disabled = false;
                botonGuardar.textContent = 'GUARDAR CONFIGURACIÓN';
            }
        }

    } catch (error) {
        console.error('Error en la petición de actualización:', error);
        alert('Ocurrió un error de red al intentar comunicarse con el servidor.');
        
        if (botonGuardar) {
            botonGuardar.disabled = false;
            botonGuardar.textContent = 'GUARDAR CONFIGURACIÓN';
        }
    }
}