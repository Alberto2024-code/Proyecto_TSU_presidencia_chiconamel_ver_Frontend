document.addEventListener('DOMContentLoaded', () => {
    const gridComunidades = document.getElementById('grid-comunidades') || document.querySelector('.grid-comunidades');
    const buscarInput = document.querySelector('.search-container input');

    let listaComunidadesGlobal = [];

    // Función que DIBUJA las cards dinámicas
    function pintarCards(comunidades) {
        if (!gridComunidades) return;

        gridComunidades.innerHTML = ''; // Limpiar contenedor

        if (!Array.isArray(comunidades) || comunidades.length === 0) {
            gridComunidades.innerHTML = `
                <p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #777; font-weight: bold;">
                    No se encontraron comunidades registradas.
                </p>`;
            return;
        }

        comunidades.forEach(comunidad => {
            const idComunidad = comunidad.id_comunidad || comunidad.id;
            const nombreComunidad = comunidad.nombre_comunidad || comunidad.nombre || 'SIN NOMBRE';

            // Crear el enlace <a class="card">
            const cardLink = document.createElement('a');
            // Manda el ID de la comunidad a la pantalla de civiles
            cardLink.href = `../html/civilesDeComunidades.html?comunidad=${idComunidad}`;
            cardLink.className = 'card';
            cardLink.textContent = nombreComunidad.toUpperCase();

            gridComunidades.appendChild(cardLink);
        });
    }

    // 🚀 Función para consumir la API con Respaldo en Localhost
    async function cargarComunidades() {
        const endpoint = '/api/comunidades/comunidad';
        let response;

        try {
            // 💡 1. Primer intento: usando IP dinámica del Servidor
            response = await fetch(`http://${window.location.hostname}:3000${endpoint}`);
        } catch (netError) {
            console.warn("⚠️ Falló la conexión por IP/Red. Intentando conexión local directa (localhost)...");
            try {
                // 🔄 2. Segundo intento (Respaldo sin red / TP-Link apagado): conecta a localhost
                response = await fetch(`http://localhost:3000${endpoint}`);
            } catch (localError) {
                console.error('❌ Error crítico al obtener comunidades:', localError);
                if (gridComunidades) {
                    gridComunidades.innerHTML = `
                        <p style="grid-column: 1/-1; text-align: center; color: red; padding: 20px;">
                            Error al cargar las comunidades desde el servidor.
                        </p>`;
                }
                return;
            }
        }

        try {
            if (!response || !response.ok) {
                throw new Error('Error al conectar con la API');
            }
            const data = await response.json();
            listaComunidadesGlobal = data;
            pintarCards(listaComunidadesGlobal);
        } catch (error) {
            console.error('❌ Error al procesar los datos de comunidades:', error);
        }
    }

    // Ejecutamos la carga inicial
    cargarComunidades();

    // 🔍 Buscador en tiempo real
    if (buscarInput) {
        buscarInput.addEventListener('input', (e) => {
            const texto = e.target.value.toLowerCase().trim();
            const filtradas = listaComunidadesGlobal.filter(com => {
                const nombre = (com.nombre_comunidad || com.nombre || '').toLowerCase();
                return nombre.includes(texto);
            });
            pintarCards(filtradas);
        });
    }
});