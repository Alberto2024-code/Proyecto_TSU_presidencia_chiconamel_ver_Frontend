document.addEventListener('DOMContentLoaded', () => {
    const tablaBody = document.querySelector('.tabla-usuarios tbody');
    const inputBuscador = document.querySelector('.search-container input');
    
    // Guardaremos aquí los datos originales para poder filtrar
    let datosCortes = [];

    // 1. Función para consumir la API y obtener los datos
    const obtenerCortesMes = async () => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/recibo/reporte/cortes-mes');
            if (!respuesta.ok) {
                throw new Error('Error al consultar el reporte de cortes');
            }
            
            datosCortes = await respuesta.json();
            renderizarTabla(datosCortes);

        } catch (error) {
            console.error('Error:', error);
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: red;">
                        Error al cargar los datos del reporte.
                    </td>
                </tr>
            `;
        }
    };

    // 2. Función para pintar los datos dentro del <tbody>
    const renderizarTabla = (lista) => {
        tablaBody.innerHTML = ''; // Limpiamos la tabla primero

        if (lista.length === 0) {
            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center;">No se encontraron registros.</td>
                </tr>
            `;
            return;
        }

        lista.forEach((item) => {
            // Formateamos el monto a moneda ($4,460.00)
            const montoFormateado = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            }).format(item.total_recaudado);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.fecha_corte}</td>
                <td>${item.nombre_comunidad}</td>
                <td>${montoFormateado}</td>
                <td>${item.usuarios_que_pagaron}</td>
                <td>${item.total_ciudadanos}</td>
            `;
            tablaBody.appendChild(tr);
        });
    };

    // 3. Funcionalidad del Buscador por Nombre de Comunidad
    inputBuscador.addEventListener('input', (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();
        
        const resultadosFiltrados = datosCortes.filter(item => 
            item.nombre_comunidad.toLowerCase().includes(textoBusqueda)
        );

        renderizarTabla(resultadosFiltrados);
    });

    // Iniciar la carga de datos
    obtenerCortesMes();
});