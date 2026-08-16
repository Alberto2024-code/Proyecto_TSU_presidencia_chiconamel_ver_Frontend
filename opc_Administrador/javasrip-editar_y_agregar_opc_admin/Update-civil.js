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
    const urlParams = new URLSearchParams(window.location.search);
    const civilId = urlParams.get('edit'); 

    if (!civilId) {
        alert('Error: No se proporcionó un ID de ciudadano válido en la URL.');
        return;
    }

    // Guardamos el ID en el formulario de forma segura
    document.getElementById('formUsuario').dataset.id = civilId;

    // Cargamos los catálogos antes de pintar los datos del civil
    await cargarComunidades();
    await cargarDomicilios();
    await cargarDatosCivil(civilId);
});

// ==========================================
// 2. RECUPERACIÓN DE CATÁLOGOS (Comunidades y Domicilios)
// ==========================================
async function cargarComunidades() {
    const selectComunidad = document.getElementById('comunidad');
    try {
        const response = await fetchConFallback('/api/comunidades/comunidades');
        if (!response.ok) throw new Error('Error en respuesta del servidor al obtener comunidades.');

        const comunidades = await response.json();

        selectComunidad.innerHTML = '<option value="">-- Selecciona una Comunidad --</option>';
        comunidades.forEach(comunidad => {
            const option = document.createElement('option');
            option.value = comunidad.id_comunidad;
            option.textContent = comunidad.nombre_comunidad;
            selectComunidad.appendChild(option);
        });
    } catch (error) {
        console.error('Error en el catálogo de comunidades:', error);
        selectComunidad.innerHTML = '<option value="">Error al cargar comunidades</option>';
    }
}

// 🎯 Carga las calles en el select
async function cargarDomicilios() {
    const selectDomicilio = document.getElementById('domicilio');
    try {
        const response = await fetchConFallback('/api/civiles/domicilios');
        if (!response.ok) throw new Error('Error en respuesta del servidor al obtener domicilios.');

        const domicilios = await response.json();

        selectDomicilio.innerHTML = '<option value="">-- Selecciona una Calle/Domicilio --</option>';
        domicilios.forEach(domicilio => {
            const option = document.createElement('option');
            option.value = domicilio.id_domicilio; // Mandamos el ID numérico al value
            option.textContent = domicilio.domicilio; // Lo que lee el usuario
            selectDomicilio.appendChild(option);
        });
    } catch (error) {
        console.error('Error en el catálogo de domicilios:', error);
        selectDomicilio.innerHTML = '<option value="">Error al cargar domicilios</option>';
    }
}

// ==========================================
// 3. CARGA DE DATOS ORIGINALES EN EL DOM
// ==========================================
async function cargarDatosCivil(id) {
    try {
        const response = await fetchConFallback(`/api/civiles/civiles/${id}`);
        if (!response.ok) throw new Error('No se pudo obtener la información del ciudadano.');

        const civil = await response.json();

        document.getElementById('nombre').value           = civil.nombre || '';
        document.getElementById('apellido_paterno').value = civil.apellido_paterno || '';
        document.getElementById('apellido_materno').value = civil.apellido_materno || '';
        
        // 🎯 SELECCIÓN AUTOMÁTICA DEL DOMICILIO: Mapea con el ID devuelto por el backend
        document.getElementById('domicilio').value        = civil.id_domicilio || civil.domicilio || '';
        
        const inputCuenta = document.getElementById('cuenta-no') || document.getElementById('cuenta_no');
        if (inputCuenta) inputCuenta.value = civil.cuenta_no || '';
        
        if (civil.tipo_servicio === "Domestico" || civil.tipo_servicio == 1) {
            document.getElementById('tipo-servicio').value = "1";
        } else {
            document.getElementById('tipo-servicio').value = "2";
        }

        document.getElementById('estado').value    = (civil.estado === "Activo") ? "1" : "2";
        document.getElementById('comunidad').value = civil.id_comunidad || '';

    } catch (error) {
        console.error('Falla al recuperar entidad civil:', error);
        alert('Hubo un problemita al recuperar los datos actuales del ciudadano.');
    }
}

// ==========================================
// 4. PERSISTENCIA: ENVÍO DE ACTUALIZACIÓN (PUT)
// ==========================================
document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const id = document.getElementById('formUsuario').dataset.id;
    
    const nombre           = document.getElementById('nombre').value.trim();
    const apellido_paterno = document.getElementById('apellido_paterno').value.trim();
    const apellido_materno = document.getElementById('apellido_materno').value.trim();
    
    // 🎯 OBTENCIÓN DEL ID DE DOMICILIO DESDE EL SELECT
    const id_domicilio     = document.getElementById('domicilio').value;
    
    const inputCuenta      = document.getElementById('cuenta-no') || document.getElementById('cuenta_no');
    const cuenta_no        = inputCuenta ? inputCuenta.value.trim() : '';
    
    const id_comunidad     = document.getElementById('comunidad').value;

    // Validaciones defensivas
    if (!id_domicilio) {
        alert('Por favor, selecciona un domicilio válido.');
        return;
    }
    if (!id_comunidad) {
        alert('Por favor, selecciona una comunidad válida.');
        return;
    }

    const tipoServicioSelect = document.getElementById('tipo-servicio').value;
    const tipo_servicio      = parseInt(tipoServicioSelect); 

    const estadoSelect       = document.getElementById('estado').value;
    const estado             = (estadoSelect === "1") ? "Activo" : "Inactivo";

    // Objeto estructurado para el Backend
    const civilModificado = {
        nombre,
        apellido_paterno,
        apellido_materno,
        domicilio: parseInt(id_domicilio), // 🎯 Enviamos el ID numérico id_domicilio
        cuenta_no,
        tipo_servicio, 
        estado,
        id_comunidad: parseInt(id_comunidad)
    };

    try {
        const response = await fetchConFallback(`/api/civiles/Update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(civilModificado)
        });

        if (!response) throw new Error('No se obtuvo respuesta del servidor backend.');

        const data = await response.json();

        if (response.ok) {
            alert('¡Los datos del civil se actualizaron con éxito!');
            window.location.href = '../opc_Administrador/civilesDeComunidades.html';
        } else {
            alert(`Error en el servidor: ${data.message || 'No se pudo actualizar el registro.'}`);
        }

    } catch (error) {
        console.error('Error crítico en transacción de actualización (PUT):', error);
        alert('Hubo un error de conexión con el servidor de base de datos.');
    }
});