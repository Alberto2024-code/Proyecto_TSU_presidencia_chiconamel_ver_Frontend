document.addEventListener('DOMContentLoaded', () => {
    const gridComunidades = document.getElementById('grid-comunidades') || document.querySelector('.grid-comunidades');
    const buscarInput = document.querySelector('.search-container input');

    let listaComunidadesGlobal = [];

    // Función que DIBUJA las cards dinámicas
    function pintarCards(comunidades) {
        if (!gridComunidades) return;

        gridComunidades.innerHTML = ''; // Limpiar contenedor

        if (comunidades.length === 0) {
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
            cardLink.href = `../opc_Administrador/civilesDeComunidades.html?comunidad=${idComunidad}`;
            cardLink.className = 'card';
            cardLink.textContent = nombreComunidad.toUpperCase();

            gridComunidades.appendChild(cardLink);
        });
    }

    // 🚀 Consumir la API
    fetch('http://localhost:3000/api/comunidades/comunidad')
        .then(response => {
            if (!response.ok) throw new Error('Error al conectar con la API');
            return response.json();
        })
        .then(data => {
            listaComunidadesGlobal = data;
            pintarCards(listaComunidadesGlobal);
        })
        .catch(error => {
            console.error('❌ Error al obtener comunidades:', error);
            if (gridComunidades) {
                gridComunidades.innerHTML = `
                    <p style="grid-column: 1/-1; text-align: center; color: red; padding: 20px;">
                        Error al cargar las comunidades desde el servidor.
                    </p>`;
            }
        });

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