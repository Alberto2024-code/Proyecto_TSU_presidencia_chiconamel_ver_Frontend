// 1. Capturamos el ID que viene en la URL (?comunidad=4)
const urlParams = new URLSearchParams(window.location.search);
const idComunidad = urlParams.get('comunidad');

// Buscamos el cuerpo de la tabla en tu HTML para meter las filas
const tablaUsuarios = document.getElementById('tabla-usuarios'); 

if (idComunidad) {
    // 2. CORRECCIÓN: Apuntamos exactamente a la ruta limpia que probamos en tu navegador
    fetch(`http://localhost:3000/api/civiles/civiles/comunidad/${idComunidad}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al conectar con el servidor');
            }
            return response.json();
        })
        .then(data => {
            // Limpiamos los datos de prueba que tenga la tabla
            tablaUsuarios.innerHTML = ''; 

            // Si la base de datos no encuentra registros
            if (data.length === 0) {
                tablaUsuarios.innerHTML = `
                    <tr>
                        <td colspan="11" style="text-align: center; padding: 25px; color: #777; font-weight: bold;">
                            No se encontraron ciudadanos registrados en esta zona. 
                        </td>
                    </tr>`;
                return;
            }

            // 3. Recorremos los civiles que trajo tu controlador y los pintamos
            data.forEach(civil => {
                const fila = document.createElement('tr');
                
                // Se mapea con los nombres exactos de tus columnas en SQLyog
                fila.innerHTML = `
                    <td>${civil.nombre}</td>
                    <td>${civil.apellido_paterno || ''}</td>
                    <td>${civil.apellido_materno || ''}</td>
                    <td>${civil.telefono || 'S/N'}</td>
                    <td>${civil.domicilio || 'Conocido'}</td>
                    
                    <td>${civil.cuenta_no || 'S/N'}</td>
                    <td>${civil.tipo_servicio || 'Domestico'}</td>
                    <td>${civil.id_comunidad || 's/n'}</td>
                    <td>
                        <span class="badge-${civil.estado === 'Activo' ? 'activo' : 'inactivo'}">
                            ${civil.estado || 'Activo'}
                        </span>
                    </td>
                    <td>
                        <a href="resivo.html?cuenta=${civil.cuenta_no}" class="btn-cobrar">Cobrar</a>
                    </td>
                    <td>
                        <a href="resibo.html?cuenta=${civil.cuenta_no}" class="btn-ver-recibo">Ver Recibo</a>
                    </td>
                    <td>
                        <a href="#" onclick="editarCivil(${civil.id_ciudadano})" style="color: #000000; font-weight: bold; text-decoration: none;">EDITAR</a> | 
                        <a href="#" onclick="eliminarCivil(${civil.id_ciudadano})" style="color: #c92a2a; font-weight: bold; text-decoration: none;">ELIMINAR</a>
                    </td>
                `;
                
                tablaUsuarios.appendChild(fila);
            });
        })
        .catch(error => {
            console.error('❌ Error en la petición:', error);
            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; color: #d94141; padding: 25px; font-weight: bold;">
                        Error de conexión. Asegúrate de que tu backend de Node.js esté corriendo en el puerto 3000.
                    </td>
                </tr>`;
        });
} else {
    tablaUsuarios.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px;">Falta el ID de la comunidad en la URL.</td></tr>`;
}

// Funciones de ayuda para los botones de acción
function editarCivil(id) {
    console.log("Abriendo edición para el ciudadano ID:", id);
}

function eliminarCivil(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        console.log("Eliminando ciudadano ID:", id);
    }
}