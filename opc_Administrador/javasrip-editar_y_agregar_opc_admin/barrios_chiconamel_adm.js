
const urlParams = new URLSearchParams(window.location.search);
const idComunidad = urlParams.get('comunidad');
const buscarCivilInput = document.getElementById('buscar-civil');
const tablaUsuarios = document.getElementById('tabla-usuarios'); 

let listaCivilesGlobal = [];

/**
 * 
 * @param {Array} civiles - 
 */
function pintarTabla(civiles) {
   
    tablaUsuarios.innerHTML = ''; 

   
    if (civiles.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="13" style="text-align: center; padding: 25px; color: #777; font-weight: bold;">
                    No se encontraron ciudadanos registrados con esos criterios.
                </td>
            </tr>`;
        return;
    }

    civiles.forEach(civil => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${civil.id_ciudadano || 'S/N'}</td>
            <td>${civil.nombre}</td>
            <td>${civil.apellido_paterno || 'S/N'}</td>
            <td>${civil.apellido_materno || 'S/N'}</td>
            <td>${civil.cuenta_no || 'S/N'}</td>
            <td>${civil.domicilio || 'Conocido'}</td>
            <td>${civil.nombre_servicio || 'Domestico'}</td>
            <td>${civil.nombre_comunidad || 's/n'}</td>
            <td>
                <span class="badge-${civil.estado === 'Activo' ? 'activo' : 'inactivo'}">
                    ${civil.estado || 'Activo'}
                </span>
            </td>
            <td>
            
                
            <a href="../../opc_Administrador/agregar_y_editar/generar_recibo.html?cuenta=${civil.cuenta_no}&comunidad=${idComunidad}&accion=cobrar" class="link-cobrar">Cobrar</a>
            </td>
            <td>
               <a href="../../opc_Administrador/historial_recivo.html?id=${civil.id_ciudadano}" class="btn-ver-recibo">Ver Historial</a>
                </td>
            <td>
                <a href="#" onclick="editarCivil(${civil.id_ciudadano})" style="color: #000000; font-weight: bold; text-decoration: none;">EDITAR</a> | 
                <a href="#" onclick="eliminarCivil(${civil.id_ciudadano})" style="color: #c92a2a; font-weight: bold; text-decoration: none;">ELIMINAR</a>
            </td>
        `;
        
        tablaUsuarios.appendChild(fila);
    });
}

if (idComunidad) {
    fetch(`http://localhost:3000/api/civiles/civiles/comunidad/${idComunidad}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al conectar con el servidor');
            }
            return response.json();
        })
        .then(data => {
            
            listaCivilesGlobal = data; 
            pintarTabla(listaCivilesGlobal);
        })
        .catch(error => {
            console.error('❌ Error en la petición:', error);
            tablaUsuarios.innerHTML = `
                <tr>
                    <td colspan="13" style="text-align: center; color: #d94141; padding: 25px; font-weight: bold;">
                        Error de conexión. Asegúrate de que tu backend de Node.js esté corriendo en el puerto 3000.
                    </td>
                </tr>`;
        });
} else {
    tablaUsuarios.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 20px;">Falta el ID de la comunidad en la URL.</td></tr>`;
}


if (buscarCivilInput) {
    buscarCivilInput.addEventListener('input', (e) => {
        
        const textoBusqueda = e.target.value.toLowerCase().trim();

        
        const civilesFiltrados = listaCivilesGlobal.filter(civil => {
           
            const nombreCompleto = `${civil.nombre} ${civil.apellido_paterno} ${civil.apellido_materno}`.toLowerCase();
            
            return nombreCompleto.includes(textoBusqueda) || 
                   (civil.cuenta_no && civil.cuenta_no.toString().includes(textoBusqueda));
        });

       
        pintarTabla(civilesFiltrados);
    });
}

function editarCivil(id_ciudadano) {
    // Te manda a la carpeta correspondiente llevando el "?edit=ID"
    window.location.href = `../opc_Administrador/agregar_y_editar/Update-civiles.html?edit=${id_ciudadano}`;
}

async function eliminarCivil(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        console.log("Eliminando ciudadano ID:", id);
        
        try {
            const response = await fetch(`http://localhost:3000/api/civiles/Delete/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Ciudadano eliminado con éxito!');
                location.reload(); // Recarga la tabla de manera nativa para actualizar la lista
            } else {
                // Muestra la validación controlada del Backend (ej: si tiene recibos vinculados)
                alert(`Error en el servidor: ${data.message || 'No se pudo eliminar el registro.'}`);
            }

        } catch (error) {
            console.error('Error crítico al intentar eliminar civil:', error);
            alert('Hubo un error de conexión con el servidor. Revisa la consola.');
        }
    }
}