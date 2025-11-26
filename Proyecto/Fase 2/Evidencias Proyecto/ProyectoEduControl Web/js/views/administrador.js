const API_BASE_URL = 'https://edcontrol-backend.onrender.com/api';

let usuarios = [];
let asignaturas = [];
let notas = [];
let asistencias = [];
let cursos = [];
let profesores = [];

// Variables de paginación
let currentPage = 1;
let recordsPerPage = 15;
let sortField = 'nombre';
let sortDirection = 'asc';

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadUsuarios();
    setupForms();
});

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
}

function switchSection(section) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-section="' + section + '"]').classList.add('active');

    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    switch(section) {
        case 'usuarios':
            Promise.all([
                loadUsuarios(),
                loadCursos()
            ]);
            break;
        case 'cursos':
            loadCursos();
            break;
        case 'asignaturas':
            loadAsignaturas();
            // Forzar actualización del resumen después de un momento
            setTimeout(() => {
                console.log('Forzando actualización del resumen al cambiar de sección');
                renderMateriasResumen();
            }, 500);
            break;
        case 'horarios':
            Promise.all([
                loadCursos(),
                loadAsignaturas()
            ]).then(() => {
                loadHorarioSemanal();
            });
            break;
        case 'notas':
            Promise.all([
                loadUsuarios(),
                loadAsignaturas(),
                loadNotas()
            ]).then(() => {
                loadFiltersForNotas();
            });
            break;
        case 'asistencias':
            Promise.all([
                loadUsuarios(),
                loadAsignaturas(),
                loadAsistencias()
            ]).then(() => {
                loadFiltersForAsistencias();
            });
            break;
        case 'alumnos-cursos':
            Promise.all([
                loadUsuarios(),
                loadCursos()
            ]).then(() => {
                loadAlumnosPorCurso();
            });
            break;
        case 'crear-horarios':
            Promise.all([
                loadCursos(),
                loadAsignaturas()
            ]).then(() => {
                loadCrearHorarios();
            });
            break;
    }
}

async function apiRequest(endpoint, method, data, suppressAlert = false) {
    method = method || 'GET';
    try {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        console.log(`API Request: ${method} ${endpoint}`, data ? { data } : '');
        const response = await fetch(API_BASE_URL + endpoint, config);
        
        if (!response.ok) {
            // Intentar obtener el mensaje de error del servidor
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                console.log('Error response data:', errorData);
                
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
                
                // Si hay información de debug, mostrarla en consola
                if (errorData.debug) {
                    console.log('Debug info from server:', errorData.debug);
                }
                if (errorData.available) {
                    console.log('Available items:', errorData.available);
                }
            } catch (parseError) {
                console.log('Could not parse error response');
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log(`API Response: ${method} ${endpoint}`, result);
        return result;
    } catch (error) {
        console.error('API Error:', error);
        if (!suppressAlert) {
            showAlert('Error de conexión con el servidor: ' + error.message, 'error');
        }
        throw error;
    }
}

async function loadUsuarios() {
    try {
        usuarios = await apiRequest('/usuarios');
        renderUsuarios();
    } catch (error) {
        console.error('Error loading usuarios:', error);
    }
}

async function loadCursos() {
    try {
        const response = await apiRequest('/debug/cursos');
        console.log('Respuesta debug cursos:', response);
        
        // Extraer el array de cursos_detalle
        cursos = response.cursos_detalle || response;
        console.log('Cursos procesados:', cursos);
        console.log('Cantidad de cursos:', cursos.length);
        renderCursos();
    } catch (error) {
        console.error('Error loading cursos:', error);
        // Fallback al endpoint original
        try {
            cursos = await apiRequest('/cursos');
            console.log('Cursos cargados desde endpoint original:', cursos);
            renderCursos();
        } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError);
            showAlert('Error al cargar cursos', 'error');
        }
    }
}

function renderCursos() {
    const tbody = document.querySelector('#cursosTable tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(cursos)) {
        console.error('cursos no es un array:', cursos);
        return;
    }

    cursos.forEach((curso, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${curso.nombre}</td>
            <td>${curso.nivel || 'N/A'}</td>
            <td>${curso.descripcion || ''}</td>
            <td>
                <button class="btn btn-warning edit-curso" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-curso" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function saveCurso() {
    try {
        const id = document.getElementById('cursoId').value;
        const nombre = document.getElementById('cursoNombre').value.trim();
        const nivel = document.getElementById('cursoNivel').value;
        const descripcion = document.getElementById('cursoDescripcion').value.trim();
        
        if (!nombre) {
            showAlert('El nombre del curso es obligatorio', 'error');
            return;
        }
        if (!nivel) {
            showAlert('Debe seleccionar un nivel', 'error');
            return;
        }
        
        const data = {
            nombre: nombre,
            nivel: nivel,
            descripcion: descripcion
        };

        console.log('Guardando curso:', { id, data });

        if (id) {
            console.log(`Actualizando curso con ID: ${id}`);
            const response = await apiRequest('/cursos/' + id, 'POST', data);
            console.log('Respuesta de actualización:', response);
            
            if (response && response.message) {
                console.log('Mensaje del servidor:', response.message);
            }
            
            showAlert('Curso actualizado correctamente', 'success');
        } else {
            console.log('Creando nuevo curso');
            const response = await apiRequest('/cursos', 'POST', data);
            console.log('Respuesta de creación:', response);
            
            if (response && response.message) {
                console.log('Mensaje del servidor:', response.message);
            }
            
            showAlert('Curso creado correctamente', 'success');
        }

        closeModal('cursoModal');
        await loadCursos();
    } catch (error) {
        console.error('Error completo al guardar curso:', error);
        
        // Mostrar información de debug si está disponible
        if (error.message && error.message.includes('404')) {
            showAlert('Error: Curso no encontrado. Verifique que el ID sea correcto.', 'error');
        } else {
            showAlert('Error al guardar curso: ' + error.message, 'error');
        }
    }
}

function editCurso(curso) {
    if (!curso) return;

    openModal('cursoModal');
    
    setTimeout(() => {
        document.getElementById('cursoId').value = curso._id || curso.id || '';
        document.getElementById('cursoNombre').value = curso.nombre || '';
        document.getElementById('cursoNivel').value = curso.nivel || '';
        document.getElementById('cursoDescripcion').value = curso.descripcion || '';
    }, 100);
}

async function deleteCurso(id) {
    const confirmMessage = '¿Estás seguro de que quieres eliminar este curso?\n\nEsto eliminará también:\n- Alumnos asignados\n- Asignaturas del curso\n- Horarios del curso';
    if (!confirm(confirmMessage)) return;

    try {
        const response = await apiRequest('/cursos/' + id + '?force=true', 'DELETE');
        
        if (response && response.success) {
            showAlert('Curso eliminado correctamente', 'success');
        } else {
            showAlert('Curso eliminado', 'success');
        }
        
        await loadCursos();
        await loadUsuarios();
    } catch (error) {
        console.error('Error al eliminar curso:', error);
        showAlert('Error al eliminar curso: ' + error.message, 'error');
    }
}

async function loadCursosForHorario() {
    const select = document.getElementById('cursoHorarioSelect');
    select.innerHTML = '<option value="">Seleccionar curso...</option>';
    
    console.log('Cursos disponibles para horario:', cursos.length);
    
    if (cursos.length > 0) {
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre;
            option.textContent = curso.nombre;
            select.appendChild(option);
        });
        console.log('Cursos agregados al select:', cursos.map(c => c.nombre));
    } else {
        console.log('No hay cursos disponibles - forzando recarga');
        await loadCursos();
        if (cursos.length > 0) {
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.nombre;
                option.textContent = curso.nombre;
                select.appendChild(option);
            });
        }
    }
    
    select.addEventListener('change', async function() {
        if (this.value) {
            await loadHorarioForCurso(this.value);
        } else {
            document.getElementById('horarioContainer').style.display = 'none';
            document.getElementById('guardarHorarioBtn').style.display = 'none';
        }
    });
}

async function loadHorarioForCurso(curso) {
    // Asegurar que las asignaturas estén cargadas
    if (asignaturas.length === 0) {
        await loadAsignaturas();
    }
    
    // Cargar materias del curso en los selects - filtrar por curso exacto
    const materiasDelCurso = asignaturas.filter(a => 
        a.curso === curso || 
        a.curso_nombre === curso || 
        a.curso_id === curso
    );
    
    console.log(`Materias encontradas para curso "${curso}":`, materiasDelCurso);
    console.log('Todas las asignaturas:', asignaturas);
    
    const selects = document.querySelectorAll('.materia-select');
    
    selects.forEach(select => {
        select.innerHTML = '<option value="">Libre</option>';
        materiasDelCurso.forEach(materia => {
            const option = document.createElement('option');
            option.value = materia._id || materia.id;
            option.textContent = materia.nombre;
            select.appendChild(option);
        });
    });
    
    // Mostrar tabla y botón guardar
    document.getElementById('horarioContainer').style.display = 'block';
    document.getElementById('guardarHorarioBtn').style.display = 'inline-block';
    
    // Cargar horario existente si existe
    await loadHorarioExistente(curso);
}

let horariosExistentes = [];

async function loadHorarioExistente(curso) {
    try {
        const cursoObj = cursos.find(c => c.nombre === curso);
        const cursoId = cursoObj ? (cursoObj._id || cursoObj.id) : null;
        
        if (!cursoId) return;
        
        const horarios = await apiRequest('/horarios');
        horariosExistentes = horarios.filter(h => h.curso_id == cursoId);
        
        // Llenar la tabla con horarios existentes
        horariosExistentes.forEach(horario => {
            const dia = horario.dia_semana.toLowerCase();
            const horaKey = `${horario.hora_inicio}-${horario.hora_fin}`;
            const select = document.querySelector(`[data-dia="${dia}"][data-hora="${horaKey}"]`);
            if (select) {
                select.value = horario.asignatura_id;
                select.dataset.horarioId = horario.id;
            }
        });
    } catch (error) {
        console.log('No hay horarios existentes para este curso');
        horariosExistentes = [];
    }
}

async function saveHorario() {
    const curso = document.getElementById('cursoHorarioSelect').value;
    if (!curso) {
        showAlert('Debe seleccionar un curso', 'error');
        return;
    }
    
    const cursoObj = cursos.find(c => c.nombre === curso);
    const cursoId = cursoObj ? (cursoObj._id || cursoObj.id) : null;
    
    if (!cursoId) {
        showAlert('Error: No se encontró el ID del curso', 'error');
        return;
    }
    
    const selects = document.querySelectorAll('.materia-select');
    let operaciones = 0;
    
    for (const select of selects) {
        const dia = select.dataset.dia;
        const hora = select.dataset.hora;
        const asignaturaId = select.value;
        const horarioId = select.dataset.horarioId;
        
        try {
            if (horarioId && !asignaturaId) {
                // Eliminar horario existente
                await apiRequest('/horarios/' + horarioId, 'DELETE');
                delete select.dataset.horarioId;
                operaciones++;
            } else if (horarioId && asignaturaId) {
                // Actualizar horario existente
                const [horaInicio, horaFin] = hora.split('-');
                const horarioData = {
                    asignatura_id: parseInt(asignaturaId),
                    curso_id: parseInt(cursoId),
                    dia_semana: dia.charAt(0).toUpperCase() + dia.slice(1),
                    hora_inicio: horaInicio,
                    hora_fin: horaFin
                };
                await apiRequest('/horarios/' + horarioId, 'PUT', horarioData);
                operaciones++;
            } else if (!horarioId && asignaturaId) {
                // Crear nuevo horario
                const [horaInicio, horaFin] = hora.split('-');
                const horarioData = {
                    asignatura_id: parseInt(asignaturaId),
                    curso_id: parseInt(cursoId),
                    dia_semana: dia.charAt(0).toUpperCase() + dia.slice(1),
                    hora_inicio: horaInicio,
                    hora_fin: horaFin
                };
                const response = await apiRequest('/horarios', 'POST', horarioData);
                if (response && response.id) {
                    select.dataset.horarioId = response.id;
                }
                operaciones++;
            }
        } catch (error) {
            console.error('Error en operación de horario:', error);
        }
    }
    
    if (operaciones > 0) {
        showAlert(`Horario actualizado correctamente (${operaciones} cambios)`, 'success');
    } else {
        showAlert('No se realizaron cambios', 'info');
    }
}

async function loadAsignaturas() {
    try {
        // Cargar usuarios primero si no están cargados
        if (usuarios.length === 0) {
            usuarios = await apiRequest('/usuarios');
        }
        profesores = usuarios.filter(u => u.id_rol === 2);
        
        // Cargar asignaturas
        asignaturas = await apiRequest('/asignaturas');
        
        // Cargar filtro de cursos
        loadCursosFilterForAsignaturas();
        
        renderAsignaturas();
        renderMateriasResumen();
    } catch (error) {
        console.error('Error loading asignaturas:', error);
        showAlert('Error al cargar asignaturas', 'error');
    }
}

function loadCursosFilterForAsignaturas() {
    const cursoSelect = document.getElementById('cursoAsignaturaFilter');
    if (cursoSelect) {
        cursoSelect.innerHTML = '<option value="">Todos los cursos</option>';
        
        // Obtener cursos únicos de las asignaturas
        const cursosUnicos = [...new Set(asignaturas.map(a => a.curso).filter(c => c))];
        
        cursosUnicos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            cursoSelect.appendChild(option);
        });
    }
}

async function cargarDatosCompletos() {
    try {
        // Usar los datos ya cargados globalmente
        const notasCompletas = notas.map(nota => {
            // Buscar alumno
            const alumno = usuarios.find(u => 
                String(u.id) === String(nota.id_alumno) || 
                String(u._id) === String(nota.id_alumno)
            );
            
            // Buscar asignatura
            const asignatura = asignaturas.find(a => 
                String(a.id) === String(nota.id_asignatura) || 
                String(a._id) === String(nota.id_asignatura)
            );
            
            // Obtener curso del alumno
            let cursoNombre = 'N/A';
            if (alumno && (alumno.curso || alumno.curso_nombre)) {
                cursoNombre = alumno.curso || alumno.curso_nombre;
            }
            
            return {
                ...nota,
                alumno_nombre: alumno ? `${alumno.nombre} ${alumno.apellido}` : 'N/A',
                curso_nombre: cursoNombre,
                asignatura_nombre: asignatura ? asignatura.nombre : 'N/A'
            };
        });
        
        return { notasCompletas };
    } catch (error) {
        console.error('Error cargando datos completos:', error);
        throw error;
    }
}

async function loadNotas() {
    try {
        notas = await apiRequest('/notas');
        renderNotas();
    } catch (error) {
        console.error('Error loading notas:', error);
        showAlert('Error al cargar notas', 'error');
    }
}

async function cargarDatosAsistenciasCompletos() {
    try {
        // Usar los datos ya cargados globalmente
        const asistenciasCompletas = asistencias.map(asistencia => {
            // Buscar alumno
            const alumno = usuarios.find(u => 
                String(u.id) === String(asistencia.id_alumno) || 
                String(u._id) === String(asistencia.id_alumno)
            );
            
            // Buscar asignatura
            const asignatura = asignaturas.find(a => 
                String(a.id) === String(asistencia.id_asignatura) || 
                String(a._id) === String(asistencia.id_asignatura)
            );
            
            // Obtener curso del alumno
            let cursoNombre = 'N/A';
            if (alumno && (alumno.curso || alumno.curso_nombre)) {
                cursoNombre = alumno.curso || alumno.curso_nombre;
            }
            
            return {
                ...asistencia,
                alumno_nombre: alumno ? `${alumno.nombre} ${alumno.apellido}` : 'N/A',
                curso_nombre: cursoNombre,
                asignatura_nombre: asignatura ? asignatura.nombre : 'N/A'
            };
        });
        
        return { asistenciasCompletas };
    } catch (error) {
        console.error('Error cargando datos de asistencias completos:', error);
        throw error;
    }
}

async function loadAsistencias() {
    try {
        asistencias = await apiRequest('/asistencias');
        renderAsistencias();
    } catch (error) {
        console.error('Error loading asistencias:', error);
    }
}

async function loadFiltersForNotas() {
    try {
        console.log('Cargando filtros para notas...');
        console.log('Usuarios:', usuarios.length);
        console.log('Asignaturas:', asignaturas.length);
        
        // Cargar filtro de cursos
        const cursos = [...new Set(usuarios.filter(u => u.id_rol === 3 && (u.curso || u.curso_nombre)).map(u => u.curso || u.curso_nombre))];
        const cursoSelect = document.getElementById('cursoFilter');
        if (cursoSelect) {
            cursoSelect.innerHTML = '<option value="">Todos los cursos</option>';
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso;
                option.textContent = curso;
                cursoSelect.appendChild(option);
            });
        }
        
        // Cargar filtro de materias
        const materiaSelect = document.getElementById('materiaFilter');
        if (materiaSelect) {
            materiaSelect.innerHTML = '<option value="">Todas las materias</option>';
            asignaturas.forEach(asignatura => {
                const option = document.createElement('option');
                option.value = asignatura._id || asignatura.id;
                option.textContent = asignatura.nombre;
                materiaSelect.appendChild(option);
            });
        }
        
        // Cargar filtro de alumnos
        const alumnos = usuarios.filter(u => u.id_rol === 3);
        const alumnoSelect = document.getElementById('alumnoFilter');
        if (alumnoSelect) {
            alumnoSelect.innerHTML = '<option value="">Todos los alumnos</option>';
            alumnos.forEach(alumno => {
                const option = document.createElement('option');
                option.value = alumno._id || alumno.id;
                option.textContent = alumno.nombre + ' ' + alumno.apellido;
                alumnoSelect.appendChild(option);
            });
        }

        // Event listeners para filtros
        [cursoSelect, materiaSelect, alumnoSelect].forEach(select => {
            if (select) {
                select.removeEventListener('change', renderNotas);
                select.addEventListener('change', renderNotas);
            }
        });
        
        // Botón limpiar filtros
        const clearBtn = document.getElementById('clearFiltersBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (cursoSelect) cursoSelect.value = '';
                if (materiaSelect) materiaSelect.value = '';
                if (alumnoSelect) alumnoSelect.value = '';
                renderNotas();
            });
        }
        
        // Renderizar notas después de cargar filtros
        renderNotas();
    } catch (error) {
        console.error('Error loading filters for notas:', error);
    }
}

function renderUsuarios() {
    const tbody = document.querySelector('#usuariosTable tbody');
    tbody.innerHTML = '';

    // Obtener filtro de rol
    const rolFilter = document.getElementById('rolFilter')?.value || '';

    // Filtrar usuarios por rol
    let usuariosFiltrados = usuarios.filter(usuario => {
        if (rolFilter && usuario.id_rol != rolFilter) {
            return false;
        }
        return true;
    });

    // Ordenar usuarios
    usuariosFiltrados.sort((a, b) => {
        let aVal = a[sortField] || '';
        let bVal = b[sortField] || '';
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Calcular paginación
    const totalRecords = usuariosFiltrados.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, totalRecords);
    
    // Obtener usuarios para la página actual
    const usuariosPagina = usuariosFiltrados.slice(startIndex, endIndex);

    usuariosPagina.forEach((usuario, index) => {
        console.log(`Renderizando usuario ${index + 1}:`, {
            id: usuario.id || usuario._id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rut: usuario.rut,
            correo: usuario.correo,
            activo: usuario.activo
        });
        
        const row = document.createElement('tr');
        const rolNombre = getRolNombre(usuario.id_rol);
        
        const telefono = usuario.telefono || 'Sin teléfono';
        const curso = usuario.curso || usuario.curso_nombre || (usuario.id_rol === 3 ? 'Sin asignar' : '-');
        
        // Estado del usuario
        const estado = usuario.activo !== false ? 'Activo' : 'Deshabilitado';
        const estadoClass = usuario.activo !== false ? 'status-activo' : 'status-deshabilitado';
        
        const assignButton = usuario.id_rol === 4 ? 
            '<button class="btn btn-info assign-alumnos" data-rut="' + (usuario.rut || '') + '" title="Asignar Alumnos">' +
                '<i class="fas fa-user-plus"></i>' +
            '</button> ' : '';
        
        // Botón de habilitar/deshabilitar (solo si no es admin)
        const toggleButton = usuario.id_rol !== 1 ? 
            (usuario.activo !== false ? 
                '<button class="btn btn-secondary disable-user" data-id="' + (usuario._id || usuario.id) + '" title="Deshabilitar Usuario">' +
                    '<i class="fas fa-lock"></i>' +
                '</button> ' :
                '<button class="btn btn-success enable-user" data-id="' + (usuario._id || usuario.id) + '" title="Habilitar Usuario">' +
                    '<i class="fas fa-unlock"></i>' +
                '</button> ') : '';
        
        row.innerHTML = '<td>' + usuario.nombre + '</td>' +
            '<td>' + (usuario.apellido || '') + '</td>' +
            '<td>' + (usuario.rut || 'N/A') + '</td>' +
            '<td>' + telefono + '</td>' +
            '<td>' + usuario.correo + '</td>' +
            '<td>' + rolNombre + '</td>' +
            '<td>' + curso + '</td>' +
            '<td><span class="' + estadoClass + '">' + estado + '</span></td>' +
            '<td>' +
                assignButton +
                toggleButton +
                '<button class="btn btn-warning edit-user" data-rut="' + (usuario.rut || '') + '">' +
                    '<i class="fas fa-edit"></i>' +
                '</button> ' +
                '<button class="btn btn-danger delete-user" data-rut="' + (usuario.rut || '') + '">' +
                    '<i class="fas fa-trash"></i>' +
                '</button>' +
            '</td>';
        tbody.appendChild(row);
    });
    
    // Actualizar información de paginación
    updatePaginationInfo(startIndex + 1, endIndex, totalRecords, currentPage, totalPages);
}

function updatePaginationInfo(start, end, total, page, totalPages) {
    document.getElementById('startRecord').textContent = start;
    document.getElementById('endRecord').textContent = end;
    document.getElementById('totalRecords').textContent = total;
    document.getElementById('pageInfo').textContent = `Página ${page} de ${totalPages}`;
    
    // Habilitar/deshabilitar botones
    document.getElementById('prevPage').disabled = page <= 1;
    document.getElementById('nextPage').disabled = page >= totalPages;
}

function changePage(direction) {
    const rolFilter = document.getElementById('rolFilter')?.value || '';
    let usuariosFiltrados = usuarios.filter(usuario => {
        if (rolFilter && usuario.id_rol != rolFilter) {
            return false;
        }
        return true;
    });
    
    const totalPages = Math.ceil(usuariosFiltrados.length / recordsPerPage);
    
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    renderUsuarios();
}

function sortTable(field) {
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    
    currentPage = 1; // Reset to first page when sorting
    renderUsuarios();
}

function renderAsignaturas() {
    const tbody = document.querySelector('#asignaturasTable tbody');
    tbody.innerHTML = '';

    // Obtener filtros
    const cursoFilter = document.getElementById('cursoAsignaturaFilter')?.value || '';
    const nivelFilter = document.getElementById('nivelFilter')?.value || '';

    // Filtrar asignaturas
    let asignaturasFiltradas = asignaturas.filter(asignatura => {
        // Filtro por curso
        if (cursoFilter && asignatura.curso !== cursoFilter) {
            return false;
        }
        
        // Filtro por nivel
        if (nivelFilter) {
            const curso = cursos.find(c => c.nombre === asignatura.curso);
            const nivelCurso = curso ? curso.nivel : '';
            if (nivelCurso !== nivelFilter) {
                return false;
            }
        }
        return true;
    });

    asignaturasFiltradas.forEach((asignatura, index) => {
        // Buscar profesor
        let nombreProfesor = 'Sin asignar';
        if (asignatura.profesor_nombre) {
            nombreProfesor = asignatura.profesor_nombre;
        } else {
            const profesorId = asignatura.id_profesor || asignatura.profesor_id;
            if (profesorId) {
                const profesor = profesores.find(p => 
                    (p.id == profesorId) || (p._id == profesorId)
                );
                if (profesor) {
                    nombreProfesor = `${profesor.nombre} ${profesor.apellido}`;
                }
            }
        }
        
        // Obtener curso y nivel
        const nombreCurso = asignatura.curso || asignatura.curso_nombre || asignatura.curso_id || 'Sin asignar';
        const curso = cursos.find(c => c.nombre === nombreCurso);
        const nivelCurso = curso ? curso.nivel : 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asignatura.nombre}</td>
            <td>${asignatura.descripcion || ''}</td>
            <td>${nombreCurso}</td>
            <td>${nombreProfesor}</td>
            <td>
                <button class="btn btn-info assign-profesor" data-index="${index}" title="Asignar Profesor">
                    <i class="fas fa-user-plus"></i>
                </button>
                <button class="btn btn-warning edit-asignatura" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-asignatura" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderMateriasResumen() {
    const statsDiv = document.getElementById('materiasStats');
    if (!statsDiv || asignaturas.length === 0) return;
    
    // Solo actualizar si el contenido está vacío o es "Cargando..."
    if (statsDiv.innerHTML === 'Cargando...' || statsDiv.innerHTML.trim() === '') {
        const totalMaterias = asignaturas.length;
        const profesoresIds = new Set(asignaturas.map(a => a.id_profesor || a.profesor_id).filter(id => id));
        const cursosSet = new Set(asignaturas.map(a => a.curso || a.curso_id).filter(c => c && c !== 'null'));
        
        // Materias por profesor
        const materiasPorProfesor = {};
        asignaturas.forEach(asignatura => {
            const profesorId = asignatura.id_profesor || asignatura.profesor_id;
            let nombreProfesor = 'Sin asignar';
            
            if (asignatura.profesor_nombre) {
                nombreProfesor = asignatura.profesor_nombre;
            } else if (profesorId) {
                const profesor = profesores.find(p => (p.id == profesorId) || (p._id == profesorId));
                if (profesor) {
                    nombreProfesor = `${profesor.nombre} ${profesor.apellido}`;
                }
            }
            
            if (!materiasPorProfesor[nombreProfesor]) {
                materiasPorProfesor[nombreProfesor] = [];
            }
            materiasPorProfesor[nombreProfesor].push(asignatura.nombre);
        });
        
        let html = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 10px;">
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                    <h5 style="margin: 0 0 5px 0; color: #1976d2;"><i class="fas fa-book"></i> Total Materias</h5>
                    <p style="margin: 0; font-size: 1.5rem; font-weight: bold;">${totalMaterias}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                    <h5 style="margin: 0 0 5px 0; color: #388e3c;"><i class="fas fa-chalkboard-teacher"></i> Profesores Activos</h5>
                    <p style="margin: 0; font-size: 1.5rem; font-weight: bold;">${profesoresIds.size}</p>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                    <h5 style="margin: 0 0 5px 0; color: #f57c00;"><i class="fas fa-school"></i> Cursos con Materias</h5>
                    <p style="margin: 0; font-size: 1.5rem; font-weight: bold;">${cursosSet.size}</p>
                </div>
            </div>
            
            <div style="margin-top: 15px; background: white; padding: 15px; border-radius: 8px;">
                <h5 style="margin: 0 0 10px 0; color: #1976d2;"><i class="fas fa-list"></i> Materias por Profesor:</h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px;">`;
        
        Object.entries(materiasPorProfesor).forEach(([profesor, materias]) => {
            html += `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #667eea;">
                    <strong style="color: #495057;">${profesor}</strong>
                    <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #6c757d;">`;
            
            materias.forEach(materia => {
                html += `<li>${materia}</li>`;
            });
            
            html += `</ul></div>`;
        });
        
        html += `</div></div>`;
        
        statsDiv.innerHTML = html;
    }
}

async function renderNotasCompletas() {
    const tbody = document.querySelector('#notasTable tbody');
    tbody.innerHTML = '';

    // Obtener valores de filtros
    const cursoFilter = document.getElementById('cursoFilter')?.value || '';
    const materiaFilter = document.getElementById('materiaFilter')?.value || '';
    const alumnoFilter = document.getElementById('alumnoFilter')?.value || '';

    console.log('Renderizando notas con datos:', {
        notas: notas.length,
        usuarios: usuarios.length,
        asignaturas: asignaturas.length
    });

    // Filtrar y renderizar notas
    let notasFiltradas = notas.filter(nota => {
        const alumno = usuarios.find(u => 
            String(u.id) === String(nota.id_alumno) || 
            String(u._id) === String(nota.id_alumno)
        );
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.id_asignatura) || 
            String(a._id) === String(nota.id_asignatura)
        );
        
        // Filtro por curso
        if (cursoFilter && (!alumno || (alumno.curso !== cursoFilter && alumno.curso_nombre !== cursoFilter))) {
            return false;
        }
        
        // Filtro por materia
        if (materiaFilter && (!asignatura || 
            (String(asignatura._id) !== String(materiaFilter) && String(asignatura.id) !== String(materiaFilter)))) {
            return false;
        }
        
        // Filtro por alumno
        if (alumnoFilter && String(nota.id_alumno) !== String(alumnoFilter)) {
            return false;
        }
        
        return true;
    });

    notasFiltradas.forEach((nota, index) => {
        console.log('Procesando nota:', nota);
        
        // Intentar diferentes campos para alumno
        const alumnoId = nota.id_alumno || nota.alumno_id || nota.student_id;
        const asignaturaId = nota.id_asignatura || nota.asignatura_id || nota.subject_id;
        
        const alumno = usuarios.find(u => 
            String(u.id) === String(alumnoId) || 
            String(u._id) === String(alumnoId) ||
            u.correo === nota.alumno_correo
        );
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(asignaturaId) || 
            String(a._id) === String(asignaturaId)
        );
        
        const alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : (nota.alumno_nombre || `ID: ${alumnoId}`);
        const cursoNombre = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : (nota.curso_nombre || 'N/A');
        const asignaturaNombre = asignatura ? asignatura.nombre : (nota.asignatura_nombre || `ID: ${asignaturaId}`);
        
        console.log('Nota procesada:', {
            alumno: alumnoNombre,
            curso: cursoNombre,
            asignatura: asignaturaNombre,
            alumnoId: alumnoId,
            asignaturaId: asignaturaId
        });
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumnoNombre}</td>
            <td>${cursoNombre}</td>
            <td>${asignaturaNombre}</td>
            <td>${nota.valor}</td>
            <td>${formatDate(nota.fecha)}</td>
            <td>
                <button class="btn btn-warning edit-nota" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-nota" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Tabla renderizada con', notasFiltradas.length, 'registros');
}

function renderNotas() {
    const tbody = document.querySelector('#notasTable tbody');
    tbody.innerHTML = '';

    // Obtener valores de filtros
    const cursoFilter = document.getElementById('cursoFilter')?.value || '';
    const materiaFilter = document.getElementById('materiaFilter')?.value || '';
    const alumnoFilter = document.getElementById('alumnoFilter')?.value || '';

    console.log('Renderizando notas:', notas.length);
    console.log('Usuarios disponibles:', usuarios.length);
    console.log('Asignaturas disponibles:', asignaturas.length);

    // Filtrar notas usando alumno_correo
    let notasFiltradas = notas.filter(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        
        // Filtro por curso
        if (cursoFilter && (!alumno || (alumno.curso !== cursoFilter && alumno.curso_nombre !== cursoFilter))) {
            return false;
        }
        
        // Filtro por materia
        if (materiaFilter && (!asignatura || 
            (String(asignatura._id) !== String(materiaFilter) && String(asignatura.id) !== String(materiaFilter)))) {
            return false;
        }
        
        // Filtro por alumno
        if (alumnoFilter && (!alumno || (String(alumno._id) !== String(alumnoFilter) && String(alumno.id) !== String(alumnoFilter)))) {
            return false;
        }
        
        return true;
    });

    console.log('Notas filtradas:', notasFiltradas.length);

    notasFiltradas.forEach((nota, index) => {
        // Buscar alumno por correo
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        
        // Buscar asignatura por ID
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        
        // Nombre del alumno
        const alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : nota.alumno_correo;
        
        // Curso del alumno
        const cursoNombre = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'N/A';
        
        // Nombre de la asignatura
        const asignaturaNombre = nota.materia_nombre || (asignatura ? asignatura.nombre : 'N/A');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumnoNombre}</td>
            <td>${cursoNombre}</td>
            <td>${asignaturaNombre}</td>
            <td>${nota.valor}</td>
            <td>${formatDate(nota.fecha)}</td>
            <td>
                <button class="btn btn-warning edit-nota" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-nota" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function renderAsistenciasCompletas() {
    const tbody = document.querySelector('#asistenciasTable tbody');
    tbody.innerHTML = '';

    // Obtener valores de filtros
    const cursoFilter = document.getElementById('cursoAsistenciaFilter')?.value || '';
    const alumnoFilter = document.getElementById('alumnoAsistenciaFilter')?.value || '';

    // Filtrar asistencias
    let asistenciasFiltradas = asistencias.filter(asistencia => {
        const alumno = usuarios.find(u => 
            String(u.id) === String(asistencia.id_alumno) || 
            String(u._id) === String(asistencia.id_alumno)
        );
        
        // Filtro por curso
        if (cursoFilter && (!alumno || (alumno.curso !== cursoFilter && alumno.curso_nombre !== cursoFilter))) {
            return false;
        }
        
        // Filtro por alumno
        if (alumnoFilter && String(asistencia.id_alumno) !== String(alumnoFilter)) {
            return false;
        }
        
        return true;
    });

    asistenciasFiltradas.forEach((asistencia, index) => {
        const alumno = usuarios.find(u => 
            String(u.id) === String(asistencia.id_alumno) || 
            String(u._id) === String(asistencia.id_alumno)
        );
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(asistencia.id_asignatura) || 
            String(a._id) === String(asistencia.id_asignatura)
        );
        
        const alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : `ID: ${asistencia.id_alumno}`;
        const cursoNombre = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'N/A';
        const asignaturaNombre = asignatura ? asignatura.nombre : `ID: ${asistencia.id_asignatura}`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumnoNombre}</td>
            <td>${cursoNombre}</td>
            <td>${asignaturaNombre}</td>
            <td>${formatDate(asistencia.fecha)}</td>
            <td><span class="status-${asistencia.estado.toLowerCase()}">${asistencia.estado}</span></td>
            <td>
                <button class="btn btn-warning edit-asistencia" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-asistencia" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAsistencias() {
    const tbody = document.querySelector('#asistenciasTable tbody');
    tbody.innerHTML = '';

    // Obtener valores de filtros
    const cursoFilter = document.getElementById('cursoAsistenciaFilter')?.value || '';
    const alumnoFilter = document.getElementById('alumnoAsistenciaFilter')?.value || '';

    // Filtrar asistencias usando alumno_correo
    let asistenciasFiltradas = asistencias.filter(asistencia => {
        const alumno = usuarios.find(u => u.correo === asistencia.alumno_correo);
        
        // Filtro por curso
        if (cursoFilter && (!alumno || (alumno.curso !== cursoFilter && alumno.curso_nombre !== cursoFilter))) {
            return false;
        }
        
        // Filtro por alumno
        if (alumnoFilter && (!alumno || (String(alumno._id) !== String(alumnoFilter) && String(alumno.id) !== String(alumnoFilter)))) {
            return false;
        }
        
        return true;
    });

    asistenciasFiltradas.forEach((asistencia, index) => {
        // Usar datos directos de la asistencia
        const alumnoNombre = asistencia.alumno_nombre || asistencia.alumno_correo;
        const alumno = usuarios.find(u => u.correo === asistencia.alumno_correo);
        const cursoNombre = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'N/A';
        const asignaturaNombre = asistencia.materia_nombre || 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumnoNombre}</td>
            <td>${cursoNombre}</td>
            <td>${asignaturaNombre}</td>
            <td>${formatDate(asistencia.fecha)}</td>
            <td><span class="status-${asistencia.estado.toLowerCase()}">${asistencia.estado}</span></td>
            <td>
                <button class="btn btn-warning edit-asistencia" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-asistencia" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getRolNombre(idRol) {
    const roles = {
        1: 'Administrador',
        2: 'Profesor',
        3: 'Alumno',
        4: 'Tutor'
    };
    return roles[idRol] || 'Desconocido';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    const form = document.querySelector('#' + modalId + ' form');
    if (form) {
        form.reset();
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => input.value = '');
    }

    if (modalId === 'usuarioModal') {
        // Forzar carga de cursos antes de llenar el select
        loadCursos().then(() => {
            loadCursosInSelect();
        });
    }
    if (modalId === 'notaModal') {
        document.getElementById('notaFecha').value = new Date().toISOString().split('T')[0];
        loadAlumnosAndAsignaturasForNota();
    }
    if (modalId === 'asistenciaModal') {
        document.getElementById('asistenciaFecha').value = new Date().toISOString().split('T')[0];
        loadAlumnosAndAsignaturasForAsistencia();
    }
    if (modalId === 'asignaturaModal') {
        loadProfesoresInSelect();
        loadCursosInAsignaturaSelect();
    }
}

function loadCursosInSelect() {
    const select = document.getElementById('usuarioCurso');
    select.innerHTML = '<option value="">Seleccionar curso...</option>';
    
    console.log('loadCursosInSelect - Cursos disponibles:', cursos);
    console.log('loadCursosInSelect - Cantidad:', cursos ? cursos.length : 'undefined');
    
    if (!Array.isArray(cursos)) {
        console.error('cursos no es un array en loadCursosInSelect:', cursos);
        return;
    }
    
    cursos.forEach(curso => {
        console.log('Agregando curso al select:', curso.nombre);
        const option = document.createElement('option');
        option.value = curso.nombre;
        option.textContent = curso.nombre;
        select.appendChild(option);
    });
    
    console.log('Select final tiene', select.children.length - 1, 'opciones');
}

function loadProfesoresInSelect() {
    const select = document.getElementById('asignaturaProfesor');
    select.innerHTML = '<option value="">Seleccionar profesor...</option>';
    
    profesores.forEach(profesor => {
        const option = document.createElement('option');
        option.value = profesor._id || profesor.id;
        option.textContent = `${profesor.nombre} ${profesor.apellido}`;
        select.appendChild(option);
    });
}

function loadCursosInAsignaturaSelect() {
    const select = document.getElementById('asignaturaCurso');
    select.innerHTML = '<option value="">Seleccionar curso...</option>';
    
    console.log('Cargando cursos en select de asignatura:', cursos.length);
    
    if (!Array.isArray(cursos) || cursos.length === 0) {
        console.log('No hay cursos disponibles, intentando cargar...');
        loadCursos().then(() => {
            if (Array.isArray(cursos) && cursos.length > 0) {
                cursos.forEach(curso => {
                    const option = document.createElement('option');
                    option.value = curso.nombre;
                    option.textContent = curso.nombre;
                    select.appendChild(option);
                });
            }
        });
    } else {
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.nombre;
            option.textContent = curso.nombre;
            select.appendChild(option);
        });
    }
}

function loadAlumnosAndAsignaturasForNota() {
    // Cargar alumnos
    const alumnoSelect = document.getElementById('notaAlumno');
    alumnoSelect.innerHTML = '<option value="">Seleccionar alumno...</option>';
    
    const alumnos = usuarios.filter(u => u.id_rol === 3);
    alumnos.forEach(alumno => {
        const option = document.createElement('option');
        option.value = alumno._id || alumno.id;
        option.textContent = `${alumno.nombre} ${alumno.apellido} - ${alumno.curso || alumno.curso_nombre || 'Sin curso'}`;
        alumnoSelect.appendChild(option);
    });
    
    // Cargar asignaturas
    const asignaturaSelect = document.getElementById('notaAsignatura');
    asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura...</option>';
    
    asignaturas.forEach(asignatura => {
        const option = document.createElement('option');
        option.value = asignatura._id || asignatura.id;
        option.textContent = `${asignatura.nombre} - ${asignatura.curso || 'Sin curso'}`;
        asignaturaSelect.appendChild(option);
    });
}

function loadAlumnosAndAsignaturasForAsistencia() {
    // Cargar alumnos
    const alumnoSelect = document.getElementById('asistenciaAlumno');
    alumnoSelect.innerHTML = '<option value="">Seleccionar alumno...</option>';
    
    const alumnos = usuarios.filter(u => u.id_rol === 3);
    alumnos.forEach(alumno => {
        const option = document.createElement('option');
        option.value = alumno._id || alumno.id;
        option.textContent = `${alumno.nombre} ${alumno.apellido} - ${alumno.curso || alumno.curso_nombre || 'Sin curso'}`;
        alumnoSelect.appendChild(option);
    });
    
    // Cargar asignaturas
    const asignaturaSelect = document.getElementById('asistenciaAsignatura');
    asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura...</option>';
    
    asignaturas.forEach(asignatura => {
        const option = document.createElement('option');
        option.value = asignatura._id || asignatura.id;
        option.textContent = `${asignatura.nombre} - ${asignatura.curso || 'Sin curso'}`;
        asignaturaSelect.appendChild(option);
    });
}

function loadFiltersForAsistencias() {
    // Cargar filtro de cursos
    const cursos = [...new Set(usuarios.filter(u => u.id_rol === 3 && (u.curso || u.curso_nombre)).map(u => u.curso || u.curso_nombre))];
    const cursoSelect = document.getElementById('cursoAsistenciaFilter');
    if (cursoSelect) {
        cursoSelect.innerHTML = '<option value="">Todos los cursos</option>';
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso;
            option.textContent = curso;
            cursoSelect.appendChild(option);
        });
    }
    
    // Cargar filtro de materias
    const materiaSelect = document.getElementById('materiaAsistenciaFilter');
    if (materiaSelect) {
        materiaSelect.innerHTML = '<option value="">Todas las materias</option>';
        asignaturas.forEach(asignatura => {
            const option = document.createElement('option');
            option.value = asignatura._id || asignatura.id;
            option.textContent = asignatura.nombre;
            materiaSelect.appendChild(option);
        });
    }
    
    // Cargar filtro de alumnos
    const alumnos = usuarios.filter(u => u.id_rol === 3);
    const alumnoSelect = document.getElementById('alumnoAsistenciaFilter');
    if (alumnoSelect) {
        alumnoSelect.innerHTML = '<option value="">Todos los alumnos</option>';
        alumnos.forEach(alumno => {
            const option = document.createElement('option');
            option.value = alumno._id || alumno.id;
            option.textContent = alumno.nombre + ' ' + alumno.apellido;
            alumnoSelect.appendChild(option);
        });
    }

    // Event listeners para filtros
    [cursoSelect, materiaSelect, alumnoSelect].forEach(select => {
        if (select) {
            select.removeEventListener('change', renderAsistencias);
            select.addEventListener('change', renderAsistencias);
        }
    });
    
    // Botón limpiar filtros
    const clearBtn = document.getElementById('clearAsistenciaFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (cursoSelect) cursoSelect.value = '';
            if (materiaSelect) materiaSelect.value = '';
            if (alumnoSelect) alumnoSelect.value = '';
            renderAsistencias();
        });
    }
    
    renderAsistencias();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function setupForms() {
    const usuarioForm = document.getElementById('usuarioForm');
    console.log('Configurando listener para formulario:', usuarioForm);
    
    usuarioForm.addEventListener('submit', async (e) => {
        console.log('\n=== EVENTO SUBMIT CAPTURADO ===');
        e.preventDefault();
        console.log('preventDefault() ejecutado');
        
        // Verificar todos los campos antes de enviar
        const formData = new FormData(usuarioForm);
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        const telefonoInput = document.getElementById('usuarioTelefono');
        console.log('Campo teléfono directo:', {
            elemento: telefonoInput,
            valor: telefonoInput ? telefonoInput.value : 'NO ENCONTRADO',
            disabled: telefonoInput ? telefonoInput.disabled : 'N/A',
            readonly: telefonoInput ? telefonoInput.readOnly : 'N/A'
        });
        
        console.log('Llamando a saveUsuario()...');
        await saveUsuario();
        console.log('saveUsuario() completado');
    });

    document.getElementById('cursoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCurso();
    });

    document.getElementById('asignaturaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAsignatura();
    });

    document.getElementById('notaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveNota();
    });

    document.getElementById('asistenciaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAsistencia();
    });

    document.getElementById('asignarProfesorForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await asignarProfesor();
    });

    document.getElementById('asignarAlumnosForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await asignarAlumnos();
    });

    const crearHorarioForm = document.getElementById('crearHorarioForm');
    if (crearHorarioForm) {
        crearHorarioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearNuevoHorario();
        });
    }

    // Event listeners para botones
    document.getElementById('newUserBtn').addEventListener('click', () => openModal('usuarioModal'));
    
    // Filtro de usuarios por rol
    const rolFilter = document.getElementById('rolFilter');
    if (rolFilter) {
        rolFilter.addEventListener('change', () => {
            currentPage = 1; // Reset to first page when filtering
            renderUsuarios();
        });
    }
    
    const clearUsuarioFiltersBtn = document.getElementById('clearUsuarioFiltersBtn');
    if (clearUsuarioFiltersBtn) {
        clearUsuarioFiltersBtn.addEventListener('click', () => {
            if (rolFilter) rolFilter.value = '';
            currentPage = 1; // Reset to first page when clearing filters
            renderUsuarios();
        });
    }
    
    // Mostrar campo de curso solo para alumnos
    document.getElementById('usuarioRol').addEventListener('change', function() {
        const cursosGroup = document.getElementById('cursosGroup');
        if (this.value === '3') { // Alumno
            cursosGroup.style.display = 'block';
        } else {
            cursosGroup.style.display = 'none';
            document.getElementById('usuarioCurso').value = '';
        }
    });
    document.getElementById('newCursoBtn').addEventListener('click', () => openModal('cursoModal'));
    document.getElementById('newAsignaturaBtn').addEventListener('click', () => openModal('asignaturaModal'));
    const guardarHorarioBtn = document.getElementById('guardarHorarioBtn');
    if (guardarHorarioBtn) {
        guardarHorarioBtn.addEventListener('click', saveHorario);
    }
    // Filtros de asignaturas
    const cursoAsignaturaFilter = document.getElementById('cursoAsignaturaFilter');
    const nivelFilter = document.getElementById('nivelFilter');
    
    if (cursoAsignaturaFilter) {
        cursoAsignaturaFilter.addEventListener('change', renderAsignaturas);
    }
    if (nivelFilter) {
        nivelFilter.addEventListener('change', renderAsignaturas);
    }
    
    const clearAsignaturasFiltersBtn = document.getElementById('clearAsignaturasFiltersBtn');
    if (clearAsignaturasFiltersBtn) {
        clearAsignaturasFiltersBtn.addEventListener('click', () => {
            if (cursoAsignaturaFilter) cursoAsignaturaFilter.value = '';
            if (nivelFilter) nivelFilter.value = '';
            renderAsignaturas();
        });
    }
    
    document.getElementById('refreshAsignaturasBtn').addEventListener('click', async () => {
        console.log('Recarga manual de asignaturas solicitada');
        const btn = document.getElementById('refreshAsignaturasBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        btn.disabled = true;
        
        try {
            usuarios = []; // Forzar recarga de usuarios
            await loadAsignaturas();
            showAlert('Datos actualizados correctamente', 'success');
        } catch (error) {
            showAlert('Error al actualizar datos', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
    document.getElementById('newNotaBtn').addEventListener('click', () => openModal('notaModal'));
    document.getElementById('newAsistenciaBtn').addEventListener('click', () => openModal('asistenciaModal'));
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Event listeners para cerrar modales
    document.querySelectorAll('.close, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.dataset.modal;
            if (modal) closeModal(modal);
        });
    });
    
    // Event listeners para botones de accion
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
        
        // Usuarios
        if (e.target.closest('.assign-alumnos')) {
            const rut = e.target.closest('.assign-alumnos').dataset.rut;
            const tutor = usuarios.find(u => u.rut === rut);
            if (tutor) openAsignarAlumnosModal(tutor);
        }
        if (e.target.closest('.edit-user')) {
            const rut = e.target.closest('.edit-user').dataset.rut;
            const usuario = usuarios.find(u => u.rut === rut);
            console.log('Edit usuario por RUT:', rut, usuario);
            if (usuario) editUsuario(usuario.id);
        }
        if (e.target.closest('.delete-user')) {
            const rut = e.target.closest('.delete-user').dataset.rut;
            const usuario = usuarios.find(u => u.rut === rut);
            console.log('Delete usuario por RUT:', rut, usuario);
            if (usuario) deleteUsuario(usuario.id);
        }
        
        // Cursos
        if (e.target.closest('.edit-curso')) {
            const index = e.target.closest('.edit-curso').dataset.index;
            if (index !== undefined) {
                const curso = cursos[parseInt(index)];
                if (curso) editCurso(curso);
            }
        }
        if (e.target.closest('.delete-curso')) {
            const index = e.target.closest('.delete-curso').dataset.index;
            if (index !== undefined) {
                const curso = cursos[parseInt(index)];
                if (curso) deleteCurso(curso._id || curso.id);
            }
        }
        
        // Asignaturas
        if (e.target.closest('.assign-profesor')) {
            const index = e.target.closest('.assign-profesor').dataset.index;
            if (index !== undefined) {
                const asignatura = asignaturas[parseInt(index)];
                if (asignatura) {
                    openAsignarProfesorModal(asignatura);
                }
            }
        }
        if (e.target.closest('.edit-asignatura')) {
            const index = e.target.closest('.edit-asignatura').dataset.index;
            if (index !== undefined) {
                const asignatura = asignaturas[parseInt(index)];
                if (asignatura) {
                    editAsignatura(asignatura);
                }
            }
        }
        if (e.target.closest('.delete-asignatura')) {
            const index = e.target.closest('.delete-asignatura').dataset.index;
            if (index !== undefined) {
                const asignatura = asignaturas[parseInt(index)];
                if (asignatura) {
                    deleteAsignatura(asignatura._id || asignatura.id);
                }
            }
        }
        
        // Notas
        if (e.target.closest('.edit-nota')) {
            const index = e.target.closest('.edit-nota').dataset.index;
            if (index !== undefined) {
                const nota = notas[parseInt(index)];
                if (nota) editNota(nota._id || nota.id);
            }
        }
        if (e.target.closest('.delete-nota')) {
            const index = e.target.closest('.delete-nota').dataset.index;
            if (index !== undefined) {
                const nota = notas[parseInt(index)];
                if (nota) deleteNota(nota._id || nota.id);
            }
        }
        
        // Asistencias
        if (e.target.closest('.edit-asistencia')) {
            const index = e.target.closest('.edit-asistencia').dataset.index;
            if (index !== undefined) {
                const asistencia = asistencias[parseInt(index)];
                if (asistencia) editAsistencia(asistencia);
            }
        }
        if (e.target.closest('.delete-asistencia')) {
            const index = e.target.closest('.delete-asistencia').dataset.index;
            if (index !== undefined) {
                const asistencia = asistencias[parseInt(index)];
                if (asistencia) deleteAsistencia(asistencia._id || asistencia.id);
            }
        }
        
        // Asignar curso a alumno
        if (e.target.closest('.assign-curso-alumno')) {
            const alumnoId = e.target.closest('.assign-curso-alumno').dataset.id;
            if (alumnoId) openAsignarCursoModal(alumnoId);
        }
        
        // Deshabilitar usuario
        if (e.target.closest('.disable-user')) {
            const userId = e.target.closest('.disable-user').dataset.id;
            if (userId) deshabilitarUsuario(userId);
        }
        
        // Habilitar usuario
        if (e.target.closest('.enable-user')) {
            const userId = e.target.closest('.enable-user').dataset.id;
            if (userId) habilitarUsuario(userId);
        }
        
        // Eliminar horario
        if (e.target.closest('.delete-horario')) {
            const horarioId = e.target.closest('.delete-horario').dataset.id;
            if (horarioId) deleteHorario(horarioId);
        }
        
        // Eliminar horario existente
        if (e.target.closest('.delete-horario-existente')) {
            const horarioId = e.target.closest('.delete-horario-existente').dataset.id;
            if (horarioId) deleteHorarioExistente(horarioId);
        }
    });
}

async function saveUsuario() {
    console.log('\n=== INICIANDO saveUsuario ===');
    
    try {
        const id = document.getElementById('usuarioId').value;
        console.log('ID del usuario:', id, '(es edición:', !!id, ')');
        
        // Capturar cada campo individualmente con logs
        const nombre = document.getElementById('usuarioNombre').value;
        const apellido = document.getElementById('usuarioApellido').value;
        const rut = document.getElementById('usuarioRut').value;
        const telefonoElement = document.getElementById('usuarioTelefono');
        const telefono = telefonoElement ? telefonoElement.value : '';
        const correo = document.getElementById('usuarioCorreo').value;
        const rol = document.getElementById('usuarioRol').value;
        const password = document.getElementById('usuarioContrasena').value;
        
        console.log('=== VALORES CAPTURADOS ===');
        console.log('Nombre:', nombre);
        console.log('Apellido:', apellido);
        console.log('RUT:', rut);
        console.log('Teléfono elemento:', telefonoElement);
        console.log('Teléfono valor:', telefono, '(longitud:', telefono.length, ')');
        console.log('Correo:', correo);
        console.log('Rol:', rol);
        console.log('Password:', password ? '[PRESENTE]' : '[VACIO]');
        
        const emailPersonal = document.getElementById('usuarioEmailPersonal').value;
        
        let data = {
            nombre: nombre,
            apellido: apellido,
            rut: rut,
            telefono: telefono,
            correo: correo,
            email_personal: emailPersonal,
            id_rol: parseInt(rol)
        };
        
        // Agregar curso si es alumno
        if (parseInt(rol) === 3) {
            const curso = document.getElementById('usuarioCurso').value;
            if (curso) {
                data.curso = curso;
            }
        }
        
        // Solo incluir contraseña si se proporcionó
        if (password && password.trim() !== '') {
            data.contrasena = password;
        }
        
        console.log('=== OBJETO DATA FINAL ===');
        console.log('Data completa:', JSON.stringify(data, null, 2));

        if (id) {
            try {
                console.log('Actualizando usuario ID:', id);
                console.log('Rol:', rol, 'Curso:', data.curso);
                
                // Si es alumno y tiene curso, usar endpoint específico
                if (parseInt(rol) === 3 && data.curso) {
                    const cursoSeleccionado = cursos.find(c => c.nombre === data.curso);
                    const cursoId = cursoSeleccionado ? (cursoSeleccionado._id || cursoSeleccionado.id) : null;
                    
                    if (!cursoId) {
                        showAlert('Error: No se encontró el ID del curso seleccionado', 'error');
                        return;
                    }
                    
                    const response = await apiRequest(`/usuarios/${id}/asignar-curso`, 'POST', { curso_id: cursoId });
                    showAlert('Curso asignado correctamente', 'success');
                    await loadUsuarios();
                } else {
                    // Para otros usuarios o alumnos sin curso
                    console.log('Actualizando usuario con datos:', data);
                    const response = await apiRequest('/usuarios/' + id, 'PUT', data);
                    console.log('Respuesta de actualización:', response);
                    
                    if (response && response.message) {
                        console.log('Mensaje del servidor:', response.message);
                    }
                    
                    showAlert('Usuario actualizado correctamente', 'success');
                }
            } catch (error) {
                console.error('Error al actualizar usuario:', error);
                showAlert('No se pudo actualizar el usuario. Intenta crear uno nuevo.', 'error');
            }
            closeModal('usuarioModal');
            await loadUsuarios();
        } else {
            console.log('=== CREANDO NUEVO USUARIO ===');
            console.log('Datos:', data);
            
            const response = await apiRequest('/usuarios', 'POST', data);
            console.log('=== RESPUESTA DEL SERVIDOR (POST) ===');
            console.log('Respuesta completa:', response);
            if (response && response.telefono !== undefined) {
                console.log('Teléfono en respuesta:', response.telefono);
            } else {
                console.log('ADVERTENCIA: No se encontró teléfono en la respuesta');
            }
            
            showAlert('Usuario creado correctamente', 'success');
            closeModal('usuarioModal');
            await loadUsuarios();
        }

        closeModal('usuarioModal');
        await loadUsuarios();
    } catch (error) {
        showAlert('Error al guardar usuario', 'error');
    }
}

function editUsuario(id) {
    const usuario = usuarios.find(u => (u.id === id || u._id === id));
    
    if (!usuario) {
        showAlert('Usuario no encontrado', 'error');
        return;
    }

    openModal('usuarioModal');
    
    setTimeout(() => {
        document.getElementById('usuarioId').value = usuario._id || usuario.id;
        document.getElementById('usuarioNombre').value = usuario.nombre || '';
        document.getElementById('usuarioApellido').value = usuario.apellido || '';
        document.getElementById('usuarioRut').value = usuario.rut || '';
        document.getElementById('usuarioTelefono').value = usuario.telefono || '';
        document.getElementById('usuarioCorreo').value = usuario.correo || '';
        document.getElementById('usuarioEmailPersonal').value = usuario.email_personal || '';
        document.getElementById('usuarioContrasena').value = '';
        document.getElementById('usuarioRol').value = usuario.id_rol;
        
        const cursosGroup = document.getElementById('cursosGroup');
        if (usuario.id_rol === 3) {
            cursosGroup.style.display = 'block';
            const cursoSelect = document.getElementById('usuarioCurso');
            if (usuario.curso) {
                cursoSelect.value = usuario.curso;
            }
        } else {
            cursosGroup.style.display = 'none';
        }
    }, 100);
}

async function deleteUsuario(id) {
    console.log('Intentando eliminar usuario con ID:', id);
    const usuario = usuarios.find(u => (u.id === id || u._id === id));
    console.log('Usuario encontrado:', usuario);
    
    if (!usuario) {
        showAlert('Usuario no encontrado', 'error');
        return;
    }
    
    if (!confirm('Estas seguro de que quieres eliminar este usuario?')) return;

    try {
        const userId = usuario._id || usuario.id;
        await apiRequest('/usuarios/' + userId, 'DELETE');
        showAlert('Usuario eliminado correctamente', 'success');
        await loadUsuarios();
    } catch (error) {
        console.error('Error completo:', error);
        showAlert('Error al eliminar usuario: ' + error.message, 'error');
    }
}

async function saveAsignatura() {
    try {
        const id = document.getElementById('asignaturaId').value;
        const nombre = document.getElementById('asignaturaNombre').value.trim();
        const descripcion = document.getElementById('asignaturaDescripcion').value.trim();
        const curso = document.getElementById('asignaturaCurso').value;
        const profesorId = document.getElementById('asignaturaProfesor').value;
        
        // Validaciones
        if (!nombre) {
            showAlert('El nombre de la asignatura es obligatorio', 'error');
            return;
        }
        if (!descripcion) {
            showAlert('La descripción es obligatoria', 'error');
            return;
        }
        if (!curso) {
            showAlert('Debe seleccionar un curso', 'error');
            return;
        }
        if (!profesorId) {
            showAlert('Debe seleccionar un profesor', 'error');
            return;
        }
        
        const data = {
            nombre: nombre,
            descripcion: descripcion,
            curso: curso,
            id_profesor: profesorId
        };
        
        console.log('=== DATOS DE ASIGNATURA ===');
        console.log('Nombre:', nombre);
        console.log('Descripción:', descripcion);
        console.log('Curso:', curso);
        console.log('Profesor ID:', profesorId);
        console.log('Data final:', JSON.stringify(data, null, 2));

        if (id) {
            console.log('Actualizando asignatura ID:', id);
            const response = await apiRequest('/asignaturas/' + id, 'PUT', data);
            console.log('Respuesta PUT:', response);
            showAlert('Asignatura actualizada correctamente', 'success');
        } else {
            console.log('Creando nueva asignatura');
            const response = await apiRequest('/asignaturas', 'POST', data);
            console.log('Respuesta POST:', response);
            showAlert('Asignatura creada correctamente', 'success');
        }

        closeModal('asignaturaModal');
        await loadAsignaturas();
    } catch (error) {
        console.error('Error al guardar asignatura:', error);
        showAlert('Error al guardar asignatura', 'error');
    }
}

function editAsignatura(asignatura) {
    if (!asignatura) return;

    openModal('asignaturaModal');
    
    setTimeout(() => {
        // Llenar campos básicos
        document.getElementById('asignaturaId').value = asignatura._id || asignatura.id || '';
        document.getElementById('asignaturaNombre').value = asignatura.nombre || '';
        document.getElementById('asignaturaDescripcion').value = asignatura.descripcion || '';
        
        // Seleccionar curso
        const cursoSelect = document.getElementById('asignaturaCurso');
        const cursoValue = asignatura.curso || asignatura.curso_nombre || asignatura.curso_id;
        if (cursoValue && cursoValue !== 'null') {
            cursoSelect.value = cursoValue;
        }
        
        // Seleccionar profesor
        const profesorSelect = document.getElementById('asignaturaProfesor');
        const profesorId = asignatura.id_profesor || asignatura.profesor_id;
        if (profesorId) {
            profesorSelect.value = profesorId;
        }
    }, 100);
}

async function deleteAsignatura(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta asignatura?')) return;

    try {
        await apiRequest('/asignaturas/' + id, 'DELETE');
        showAlert('Asignatura eliminada correctamente', 'success');
        await loadAsignaturas();
    } catch (error) {
        console.error('Error al eliminar asignatura:', error);
        showAlert('Error al eliminar asignatura', 'error');
    }
}

function openAsignarProfesorModal(asignatura) {
    openModal('asignarProfesorModal');
    
    // Cargar profesores en el select
    const profesorSelect = document.getElementById('nuevoProfesorAsignar');
    profesorSelect.innerHTML = '<option value="">Seleccionar profesor...</option>';
    
    profesores.forEach(profesor => {
        const option = document.createElement('option');
        option.value = profesor._id || profesor.id;
        option.textContent = `${profesor.nombre} ${profesor.apellido}`;
        profesorSelect.appendChild(option);
    });
    
    setTimeout(() => {
        // Llenar campos
        document.getElementById('asignaturaIdAsignar').value = asignatura._id || asignatura.id;
        document.getElementById('asignaturaNombreAsignar').value = asignatura.nombre;
        
        // Mostrar profesor actual
        let profesorActual = 'Sin asignar';
        if (asignatura.profesor_nombre) {
            profesorActual = asignatura.profesor_nombre;
        } else {
            const profesorId = asignatura.id_profesor || asignatura.profesor_id;
            if (profesorId) {
                const profesor = profesores.find(p => 
                    (p.id == profesorId) || (p._id == profesorId)
                );
                if (profesor) {
                    profesorActual = `${profesor.nombre} ${profesor.apellido}`;
                }
            }
        }
        document.getElementById('profesorActualAsignar').value = profesorActual;
    }, 100);
}

function openAsignarAlumnosModal(tutor) {
    openModal('asignarAlumnosModal');
    
    setTimeout(() => {
        document.getElementById('tutorIdAsignar').value = tutor._id || tutor.id;
        document.getElementById('tutorNombreAsignar').value = `${tutor.nombre} ${tutor.apellido}`;
        
        // Cargar alumnos disponibles
        const alumnos = usuarios.filter(u => u.id_rol === 3);
        const container = document.getElementById('alumnosCheckboxes');
        container.innerHTML = '';
        
        alumnos.forEach(alumno => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            div.innerHTML = `
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" name="alumnos" value="${alumno._id || alumno.id}" style="margin-right: 8px;">
                    ${alumno.nombre} ${alumno.apellido} - ${alumno.curso || 'Sin curso'}
                </label>
            `;
            container.appendChild(div);
        });
        
        // Cargar alumnos ya asignados (deshabilitado temporalmente)
        // loadAlumnosAsignados(tutor._id || tutor.id);
    }, 100);
}

async function loadAlumnosAsignados(tutorId) {
    try {
        const asignaciones = await apiRequest('/web/tutor-alumnos/' + tutorId);
        if (asignaciones && asignaciones.alumnos) {
            asignaciones.alumnos.forEach(alumnoId => {
                const checkbox = document.querySelector(`input[value="${alumnoId}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } catch (error) {
        console.log('No hay asignaciones previas para este tutor');
    }
}

async function asignarAlumnos() {
    try {
        const tutorId = document.getElementById('tutorIdAsignar').value;
        const checkboxes = document.querySelectorAll('input[name="alumnos"]:checked');
        const alumnosSeleccionados = Array.from(checkboxes).map(cb => cb.value);
        
        console.log('Asignando alumnos:', {
            tutorId: tutorId,
            alumnos: alumnosSeleccionados
        });
        
        if (alumnosSeleccionados.length === 0) {
            showAlert('Debe seleccionar al menos un alumno', 'error');
            return;
        }
        
        let exitosos = 0;
        let errores = 0;
        
        for (const alumnoId of alumnosSeleccionados) {
            const data = { tutor_id: tutorId };
            
            try {
                const response = await apiRequest('/usuarios/' + alumnoId, 'POST', data);
                
                if (response && response.success) {
                    exitosos++;
                    console.log(`✓ ${response.alumno.nombre} ${response.alumno.apellido} -> ${response.tutor.nombre} ${response.tutor.apellido}`);
                } else {
                    throw new Error(response.error || 'Error desconocido');
                }
            } catch (error) {
                try {
                    const altResponse = await apiRequest(`/usuarios/${alumnoId}/asignar-tutor`, 'POST', data);
                    if (altResponse && altResponse.success) {
                        exitosos++;
                    } else {
                        errores++;
                    }
                } catch (altError) {
                    errores++;
                    console.error(`✗ Error con alumno ${alumnoId}:`, error.message);
                }
            }
        }
        
        if (exitosos > 0) {
            showAlert(`${exitosos} tutor(es) asignado(s) correctamente`, 'success');
        }
        if (errores > 0) {
            showAlert(`${errores} asignación(es) fallaron`, 'error');
        }
        
        showAlert('Tutores asignados correctamente', 'success');
        closeModal('asignarAlumnosModal');
        await loadUsuarios(); // Recargar para ver cambios
    } catch (error) {
        console.error('Error al asignar alumnos:', error);
        showAlert('Error al asignar tutores: ' + error.message, 'error');
    }
}

async function asignarProfesor() {
    try {
        const asignaturaId = document.getElementById('asignaturaIdAsignar').value;
        const profesorId = document.getElementById('nuevoProfesorAsignar').value;
        
        if (!profesorId) {
            showAlert('Debe seleccionar un profesor', 'error');
            return;
        }
        
        // Buscar la asignatura actual
        const asignatura = asignaturas.find(a => 
            (a._id == asignaturaId) || (a.id == asignaturaId)
        );
        
        if (!asignatura) {
            showAlert('Asignatura no encontrada', 'error');
            return;
        }
        
        console.log('Asignando profesor:', profesorId, 'a asignatura:', asignatura.nombre);
        
        // Buscar el nombre del profesor
        const profesor = profesores.find(p => 
            (p._id === profesorId) || (p.id === profesorId)
        );
        
        if (!profesor) {
            showAlert('Profesor no encontrado', 'error');
            closeModal('asignarProfesorModal');
            return;
        }
        
        const data = {
            nombre: asignatura.nombre,
            descripcion: asignatura.descripcion,
            profesor_nombre: `${profesor.nombre} ${profesor.apellido}`
        };
        
        if (asignatura.curso) {
            data.curso = asignatura.curso;
        }
        
        console.log('Datos a enviar:', data);
        
        const response = await apiRequest('/asignaturas/' + asignaturaId, 'PUT', data);
        console.log('Respuesta del servidor:', response);
        
        showAlert('Profesor asignado correctamente', 'success');
        
        closeModal('asignarProfesorModal');
        
        // Forzar recarga completa
        usuarios = [];
        await loadAsignaturas();
    } catch (error) {
        console.error('Error completo al asignar profesor:', error);
        showAlert('Error al asignar profesor: ' + error.message, 'error');
    }
}

async function saveNota() {
    try {
        const id = document.getElementById('notaId').value;
        const alumnoId = document.getElementById('notaAlumno').value;
        const asignaturaId = document.getElementById('notaAsignatura').value;
        const valor = document.getElementById('notaValor').value;
        const fecha = document.getElementById('notaFecha').value;
        
        // Validaciones
        if (!alumnoId) {
            showAlert('Debe seleccionar un alumno', 'error');
            return;
        }
        if (!asignaturaId) {
            showAlert('Debe seleccionar una asignatura', 'error');
            return;
        }
        if (!valor || valor < 1 || valor > 7) {
            showAlert('La nota debe estar entre 1.0 y 7.0', 'error');
            return;
        }
        if (!fecha) {
            showAlert('Debe seleccionar una fecha', 'error');
            return;
        }
        
        // Obtener correo del alumno para la nueva API
        const alumno = usuarios.find(u => (u._id || u.id) == alumnoId);
        
        const tipoEvaluacion = document.getElementById('notaTipoEvaluacion').value;
        
        if (!tipoEvaluacion) {
            showAlert('Debe seleccionar un tipo de evaluación', 'error');
            return;
        }
        
        const data = {
            alumno_id: alumno ? alumno.correo : alumnoId,
            materia_id: parseInt(asignaturaId),
            nota: parseFloat(valor),
            tipo_evaluacion: tipoEvaluacion,
            fecha: fecha
        };
        
        // Obtener datos de la asignatura para el correo
        const asignatura = asignaturas.find(a => (a._id || a.id) == asignaturaId);
        
        console.log('Guardando nota:', { id, data, alumno: alumno?.nombre, asignatura: asignatura?.nombre });

        if (id) {
            // Actualizar nota existente
            await apiRequest('/notas/' + id, 'PUT', data);
            showAlert('Nota actualizada correctamente', 'success');
        } else {
            // Crear nueva nota (el backend envía correos automáticamente)
            const response = await apiRequest('/web/notas', 'POST', data);
            showAlert('Nota creada correctamente y correos enviados', 'success');
        }

        closeModal('notaModal');
        await loadNotas();
    } catch (error) {
        console.error('Error al guardar nota:', error);
        showAlert('Error al guardar nota: ' + error.message, 'error');
    }
}

function editNota(id) {
    const nota = notas.find(n => (n.id === id || n._id === id));
    if (!nota) {
        console.error('Nota no encontrada:', id);
        showAlert('Nota no encontrada', 'error');
        return;
    }

    console.log('Editando nota:', nota);
    
    openModal('notaModal');
    
    setTimeout(() => {
        document.getElementById('notaId').value = nota._id || nota.id;
        
        // Buscar alumno por correo si no hay id_alumno
        if (nota.id_alumno) {
            document.getElementById('notaAlumno').value = nota.id_alumno;
        } else if (nota.alumno_correo) {
            const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
            if (alumno) {
                document.getElementById('notaAlumno').value = alumno._id || alumno.id;
            }
        }
        
        document.getElementById('notaAsignatura').value = nota.id_asignatura || nota.asignatura_id;
        document.getElementById('notaValor').value = nota.valor;
        document.getElementById('notaTipoEvaluacion').value = nota.tipo_evaluacion || '';
        document.getElementById('notaFecha').value = nota.fecha ? nota.fecha.split('T')[0] : '';
    }, 100);
}

async function deleteNota(id) {
    if (!confirm('Estas seguro de que quieres eliminar esta nota?')) return;

    try {
        await apiRequest('/notas/' + id, 'DELETE');
        showAlert('Nota eliminada correctamente', 'success');
        await loadNotas();
    } catch (error) {
        showAlert('Error al eliminar nota', 'error');
    }
}

async function saveAsistencia() {
    try {
        const id = document.getElementById('asistenciaId').value;
        const alumnoId = document.getElementById('asistenciaAlumno').value;
        const asignaturaId = document.getElementById('asistenciaAsignatura').value;
        const fecha = document.getElementById('asistenciaFecha').value;
        const estado = document.getElementById('asistenciaEstado').value;
        
        if (!alumnoId) {
            showAlert('Debe seleccionar un alumno', 'error');
            return;
        }
        if (!asignaturaId) {
            showAlert('Debe seleccionar una asignatura', 'error');
            return;
        }
        if (!fecha) {
            showAlert('Debe seleccionar una fecha', 'error');
            return;
        }
        
        const data = {
            alumno_id: alumnoId,
            asignatura_id: asignaturaId,
            fecha: fecha,
            estado: estado
        };

        if (id) {
            await apiRequest('/asistencias/' + id, 'POST', data);
            showAlert('Asistencia actualizada correctamente', 'success');
        } else {
            await apiRequest('/web/asistencias', 'POST', data);
            showAlert('Asistencia registrada correctamente', 'success');
        }

        closeModal('asistenciaModal');
        await loadAsistencias();
        loadFiltersForAsistencias();
    } catch (error) {
        console.error('Error al guardar asistencia:', error);
        showAlert('Error al guardar asistencia', 'error');
    }
}

function editAsistencia(asistencia) {
    if (!asistencia) return;

    console.log('Editando asistencia:', asistencia);
    
    // Crear modal de edición dinámicamente
    const modalHtml = `
        <div id="editAsistenciaModal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-edit"></i> Editar Asistencia</h3>
                    <span class="close" onclick="closeEditAsistenciaModal()">&times;</span>
                </div>
                <form id="editAsistenciaForm">
                    <input type="hidden" id="editAsistenciaId" value="${asistencia._id || asistencia.id}">
                    <div class="form-group">
                        <label>Alumno:</label>
                        <input type="text" value="${asistencia.alumno_nombre || 'N/A'}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Asignatura:</label>
                        <input type="text" value="${asistencia.materia_nombre || 'N/A'}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Fecha:</label>
                        <input type="date" id="editAsistenciaFecha" value="${asistencia.fecha ? asistencia.fecha.split('T')[0] : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Estado:</label>
                        <select id="editAsistenciaEstado" required>
                            <option value="Presente" ${asistencia.estado === 'Presente' ? 'selected' : ''}>Presente</option>
                            <option value="Ausente" ${asistencia.estado === 'Ausente' ? 'selected' : ''}>Ausente</option>
                            <option value="Justificado" ${asistencia.estado === 'Justificado' ? 'selected' : ''}>Justificado</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Actualizar
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeEditAsistenciaModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Agregar event listener al formulario
    document.getElementById('editAsistenciaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateAsistenciaAdmin();
    });
}

async function deleteAsistencia(id) {
    if (!confirm('Estas seguro de que quieres eliminar este registro de asistencia?')) return;

    try {
        await apiRequest('/asistencias/' + id, 'DELETE');
        showAlert('Asistencia eliminada correctamente', 'success');
        await loadAsistencias();
    } catch (error) {
        showAlert('Error al eliminar asistencia', 'error');
    }
}

async function loadAlumnosPorCurso() {
    try {
        const cursosUnicos = [...new Set(usuarios.filter(u => u.id_rol === 3 && (u.curso || u.curso_nombre)).map(u => u.curso || u.curso_nombre))];
        const cursoSelect = document.getElementById('cursoAlumnosFilter');
        if (cursoSelect) {
            cursoSelect.innerHTML = '<option value="">Todos los cursos</option>';
            cursosUnicos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso;
                option.textContent = curso;
                cursoSelect.appendChild(option);
            });
        }
        
        if (cursoSelect) {
            cursoSelect.removeEventListener('change', renderAlumnosPorCurso);
            cursoSelect.addEventListener('change', renderAlumnosPorCurso);
        }
        
        const clearBtn = document.getElementById('clearAlumnosCursoFiltersBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (cursoSelect) cursoSelect.value = '';
                renderAlumnosPorCurso();
            });
        }
        
        renderAlumnosPorCurso();
        renderCursosResumen();
    } catch (error) {
        console.error('Error loading alumnos por curso:', error);
    }
}

function renderAlumnosPorCurso() {
    const tbody = document.querySelector('#alumnosCursosTable tbody');
    tbody.innerHTML = '';
    
    const cursoFilter = document.getElementById('cursoAlumnosFilter')?.value || '';
    let alumnos = usuarios.filter(u => u.id_rol === 3);
    
    if (cursoFilter) {
        alumnos = alumnos.filter(a => (a.curso === cursoFilter || a.curso_nombre === cursoFilter));
    }
    
    alumnos.forEach(alumno => {
        let tutorNombre = alumno.tutor_nombre || 'Sin asignar';
        if (!tutorNombre || tutorNombre === 'Sin asignar') {
            if (alumno.id_tutor || alumno.tutor_id) {
                const tutor = usuarios.find(u => 
                    (u.id == alumno.id_tutor || u._id == alumno.id_tutor || u.id == alumno.tutor_id || u._id == alumno.tutor_id) && u.id_rol === 4
                );
                if (tutor) {
                    tutorNombre = `${tutor.nombre} ${tutor.apellido}`;
                }
            }
        }
        
        const cursoNombre = alumno.curso || alumno.curso_nombre || 'Sin asignar';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumno.nombre} ${alumno.apellido}</td>
            <td>${alumno.rut || 'N/A'}</td>
            <td>${alumno.correo}</td>
            <td>${alumno.telefono || 'Sin teléfono'}</td>
            <td><span class="curso-badge">${cursoNombre}</span></td>
            <td>${tutorNombre}</td>
            <td>
                <button class="btn btn-info assign-curso-alumno" data-id="${alumno._id || alumno.id}" title="Cambiar Curso">
                    <i class="fas fa-exchange-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderCursosResumen() {
    const statsDiv = document.getElementById('cursosStats');
    if (!statsDiv) return;
    
    const alumnos = usuarios.filter(u => u.id_rol === 3);
    const alumnosConCurso = alumnos.filter(a => a.curso || a.curso_nombre);
    const alumnosSinCurso = alumnos.filter(a => !a.curso && !a.curso_nombre);
    
    const alumnosPorCurso = {};
    alumnosConCurso.forEach(alumno => {
        const curso = alumno.curso || alumno.curso_nombre;
        if (!alumnosPorCurso[curso]) {
            alumnosPorCurso[curso] = [];
        }
        alumnosPorCurso[curso].push(alumno);
    });
    
    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
                <h5 style="margin: 0 0 5px 0; color: #388e3c;"><i class="fas fa-users"></i> Total Alumnos</h5>
                <p style="margin: 0; font-size: 1.5rem; font-weight: bold;">${alumnos.length}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h5 style="margin: 0 0 5px 0; color: #1976d2;"><i class="fas fa-school"></i> Con Curso</h5>
                <p style="margin: 0; font-size: 1.5rem; font-weight: bold;">${alumnosConCurso.length}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800;">
                <h5 style="margin: 0 0 5px 0; color: #f57c00;"><i class="fas fa-exclamation-triangle"></i> Sin Curso</h5>
                <p style="margin: 0; font-size: 1.5rem; font-weight: bold;">${alumnosSinCurso.length}</p>
            </div>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 8px;">
            <h5 style="margin: 0 0 10px 0; color: #1976d2;"><i class="fas fa-list"></i> Alumnos por Curso:</h5>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">`;
    
    Object.entries(alumnosPorCurso).forEach(([curso, alumnos]) => {
        html += `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; border-left: 3px solid #4caf50;">
                <strong style="color: #495057;">${curso} (${alumnos.length})</strong>
                <ul style="margin: 5px 0 0 0; padding-left: 20px; color: #6c757d; font-size: 0.9rem;">`;
        
        alumnos.slice(0, 5).forEach(alumno => {
            html += `<li>${alumno.nombre} ${alumno.apellido}</li>`;
        });
        
        if (alumnos.length > 5) {
            html += `<li><em>... y ${alumnos.length - 5} más</em></li>`;
        }
        
        html += `</ul></div>`;
    });
    
    html += `</div></div>`;
    
    statsDiv.innerHTML = html;
}

function viewCursoDetails(curso) {
    const alumnosDelCurso = usuarios.filter(u => u.id_rol === 3 && u.curso === curso.nombre);
    const asignaturasDelCurso = asignaturas.filter(a => a.curso === curso.nombre);
    
    let html = `
        <div class="curso-details">
            <h3>${curso.nombre}</h3>
            <p><strong>Nivel:</strong> ${curso.nivel}</p>
            <p><strong>Descripción:</strong> ${curso.descripcion || 'Sin descripción'}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                    <h4><i class="fas fa-users"></i> Alumnos (${alumnosDelCurso.length})</h4>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">`;
    
    if (alumnosDelCurso.length > 0) {
        alumnosDelCurso.forEach(alumno => {
            html += `<div style="padding: 5px; border-bottom: 1px solid #eee;">${alumno.nombre} ${alumno.apellido}</div>`;
        });
    } else {
        html += '<div style="color: #666; font-style: italic;">No hay alumnos asignados</div>';
    }
    
    html += `</div></div>
                <div>
                    <h4><i class="fas fa-book"></i> Asignaturas (${asignaturasDelCurso.length})</h4>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px;">`;
    
    if (asignaturasDelCurso.length > 0) {
        asignaturasDelCurso.forEach(asignatura => {
            html += `<div style="padding: 5px; border-bottom: 1px solid #eee;">${asignatura.nombre}</div>`;
        });
    } else {
        html += '<div style="color: #666; font-style: italic;">No hay asignaturas asignadas</div>';
    }
    
    html += '</div></div></div></div>';
    
    showAlert(html, 'info');
}

function openAsignarCursoModal(alumnoId) {
    const alumno = usuarios.find(u => (u._id == alumnoId || u.id == alumnoId));
    if (!alumno) {
        console.error('Alumno no encontrado:', alumnoId);
        return;
    }
    
    console.log('Abriendo modal para alumno:', alumno);
    console.log('Cursos disponibles:', cursos);
    
    let html = `
        <div style="padding: 20px; background: white; border-radius: 8px;">
            <h3 style="margin-top: 0;">Asignar Curso</h3>
            <p><strong>Alumno:</strong> ${alumno.nombre} ${alumno.apellido}</p>
            <p><strong>Curso actual:</strong> ${alumno.curso || 'Sin asignar'}</p>
            <div style="margin: 15px 0;">
                <label style="display: block; margin-bottom: 5px;">Nuevo curso:</label>
                <select id="nuevoCursoSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Seleccionar curso...</option>`;
    
    cursos.forEach(curso => {
        const cursoId = curso._id || curso.id;
        html += `<option value="${cursoId}">${curso.nombre}</option>`;
        console.log('Curso agregado:', curso.nombre, 'ID:', cursoId);
    });
    
    html += `</select>
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button onclick="window.asignarCursoAlumno('${alumnoId}')" class="btn btn-primary" style="margin-right: 10px;">Asignar</button>
                <button onclick="this.closest('.alert').remove()" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>`;
    
    showAlert(html, 'info');
}

async function asignarCursoAlumno(alumnoId) {
    const cursoId = document.getElementById('nuevoCursoSelect').value;
    if (!cursoId) {
        showAlert('Debe seleccionar un curso', 'error');
        return;
    }
    
    try {
        console.log('Asignando curso:', { alumnoId, cursoId });
        const response = await apiRequest(`/usuarios/${alumnoId}/asignar-curso`, 'POST', { curso_id: parseInt(cursoId) });
        console.log('Respuesta:', response);
        
        document.querySelector('.alert').remove();
        showAlert('Curso asignado correctamente', 'success');
        
        // Forzar recarga completa
        usuarios = [];
        await loadUsuarios();
        
        // Actualizar todas las vistas
        renderAlumnosPorCurso();
        renderCursosResumen();
        renderUsuarios();
    } catch (error) {
        console.error('Error completo:', error);
        showAlert('Error al asignar curso: ' + error.message, 'error');
    }
}

async function loadCrearHorarios() {
    // Cargar cursos en formulario de creación
    const cursoSelect = document.getElementById('crearHorarioCurso');
    cursoSelect.innerHTML = '<option value="">Seleccionar curso...</option>';
    cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso._id || curso.id;
        option.textContent = curso.nombre;
        cursoSelect.appendChild(option);
    });
    

    
    // Event listener para cargar asignaturas del curso
    cursoSelect.addEventListener('change', function() {
        const asignaturaSelect = document.getElementById('crearHorarioAsignatura');
        asignaturaSelect.innerHTML = '<option value="">Seleccionar asignatura...</option>';
        
        if (this.value) {
            const cursoSeleccionado = cursos.find(c => (c._id || c.id) == this.value);
            console.log('Curso seleccionado:', cursoSeleccionado);
            console.log('Todas las asignaturas:', asignaturas);
            
            if (cursoSeleccionado) {
                const asignaturasDelCurso = asignaturas.filter(a => {
                    const cursoId = cursoSeleccionado._id || cursoSeleccionado.id;
                    const match = a.curso_id == cursoId || a.curso_id == 2; // Temporal: mostrar asignaturas del curso 2
                    console.log(`Asignatura ${a.nombre}: curso_id=${a.curso_id}, cursoSeleccionado.id=${cursoId}, match=${match}`);
                    return match;
                });
                
                console.log('Asignaturas filtradas:', asignaturasDelCurso);
                
                asignaturasDelCurso.forEach(asignatura => {
                    const option = document.createElement('option');
                    option.value = asignatura._id || asignatura.id;
                    option.textContent = asignatura.nombre;
                    asignaturaSelect.appendChild(option);
                });
                
                if (asignaturasDelCurso.length === 0) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No hay asignaturas para este curso';
                    asignaturaSelect.appendChild(option);
                }
            }
        }
    });
    
    // Cargar horarios existentes
    await loadHorariosTable();
}

async function loadHorariosTable() {
    try {
        const horarios = await apiRequest('/horarios');
        const container = document.getElementById('schedulesContainer');
        container.innerHTML = '';
        
        // Agrupar horarios por curso
        const horariosPorCurso = {};
        
        horarios.forEach(horario => {
            const curso = cursos.find(c => (c._id || c.id) == horario.curso_id);
            const cursoNombre = curso ? curso.nombre : 'Curso no encontrado';
            
            if (!horariosPorCurso[cursoNombre]) {
                horariosPorCurso[cursoNombre] = {
                    cursoId: horario.curso_id,
                    horarios: []
                };
            }
            
            horariosPorCurso[cursoNombre].horarios.push(horario);
        });
        
        // Crear vista para cada curso
        Object.entries(horariosPorCurso).forEach(([cursoNombre, data]) => {
            const cursoDiv = document.createElement('div');
            cursoDiv.className = 'curso-schedule-section';
            
            // Crear estructura de horarios por día y hora
            const horariosPorDia = {
                'Lunes': {},
                'Martes': {},
                'Miercoles': {},
                'Jueves': {},
                'Viernes': {}
            };
            
            // Organizar horarios
            data.horarios.forEach(horario => {
                const asignatura = asignaturas.find(a => (a._id || a.id) == horario.asignatura_id);
                const horaKey = `${horario.hora_inicio}-${horario.hora_fin}`;
                
                if (horariosPorDia[horario.dia_semana]) {
                    horariosPorDia[horario.dia_semana][horaKey] = {
                        materia: asignatura ? asignatura.nombre : 'Materia no encontrada',
                        aula: horario.aula || '',
                        id: horario.id
                    };
                }
            });
            
            // Obtener todas las horas únicas y ordenarlas
            const todasLasHoras = new Set();
            data.horarios.forEach(h => {
                todasLasHoras.add(`${h.hora_inicio}-${h.hora_fin}`);
            });
            const horasOrdenadas = Array.from(todasLasHoras).sort();
            
            // Generar HTML
            let html = `
                <div class="curso-header">
                    <h4><i class="fas fa-school"></i> ${cursoNombre}</h4>
                </div>
                <div class="horario-grid">
                    <table class="horario-table-list">
                        <thead>
                            <tr>
                                <th>Hora</th>
                                <th>Lunes</th>
                                <th>Martes</th>
                                <th>Miércoles</th>
                                <th>Jueves</th>
                                <th>Viernes</th>
                            </tr>
                        </thead>
                        <tbody>`;
            
            if (horasOrdenadas.length === 0) {
                html += '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6c757d;">No hay horarios para este curso</td></tr>';
            } else {
                horasOrdenadas.forEach(hora => {
                    const [inicio, fin] = hora.split('-');
                    html += `<tr><td class="hora-col">${inicio} - ${fin}</td>`;
                    
                    ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'].forEach(dia => {
                        const horarioInfo = horariosPorDia[dia][hora];
                        if (horarioInfo) {
                            const aulaText = horarioInfo.aula ? ` (${horarioInfo.aula})` : '';
                            html += `
                                <td class="materia-cell-with-actions">
                                    <div class="materia-info">${horarioInfo.materia}${aulaText}</div>
                                    <button class="btn-delete-mini" onclick="deleteHorario('${horarioInfo.id}')" title="Eliminar">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </td>`;
                        } else {
                            html += '<td class="empty-cell">Libre</td>';
                        }
                    });
                    
                    html += '</tr>';
                });
            }
            
            html += '</tbody></table></div>';
            cursoDiv.innerHTML = html;
            container.appendChild(cursoDiv);
        });
        
        if (Object.keys(horariosPorCurso).length === 0) {
            container.innerHTML = '<div class="no-schedules"><i class="fas fa-calendar-times"></i> No hay horarios creados aún</div>';
        }
    } catch (error) {
        console.error('Error cargando horarios:', error);
    }
}

async function crearNuevoHorario() {
    const cursoId = document.getElementById('crearHorarioCurso').value;
    const asignaturaId = document.getElementById('crearHorarioAsignatura').value;
    const dia = document.getElementById('crearHorarioDia').value;
    const horaInicio = document.getElementById('crearHorarioInicio').value;
    const horaFin = document.getElementById('crearHorarioFin').value;
    const aula = document.getElementById('crearHorarioAula').value;
    
    if (!cursoId || !asignaturaId || !dia || !horaInicio || !horaFin) {
        showAlert('Todos los campos son obligatorios excepto el aula', 'error');
        return;
    }
    
    const data = {
        asignatura_id: parseInt(asignaturaId),
        curso_id: parseInt(cursoId),
        dia_semana: dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin
    };
    
    if (aula) {
        data.aula = aula;
    }
    
    try {
        await apiRequest('/horarios', 'POST', data);
        showAlert('Horario creado correctamente', 'success');
        document.getElementById('crearHorarioForm').reset();
        await loadHorariosTable();
    } catch (error) {
        showAlert('Error al crear horario: ' + error.message, 'error');
    }
}

async function deleteHorario(id) {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;
    
    try {
        await apiRequest('/horarios/' + id, 'DELETE');
        showAlert('Horario eliminado correctamente', 'success');
        await loadHorariosTable();
    } catch (error) {
        showAlert('Error al eliminar horario: ' + error.message, 'error');
    }
}

async function deleteHorarioExistente(id) {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;
    
    try {
        await apiRequest('/horarios/' + id, 'DELETE');
        showAlert('Horario eliminado correctamente', 'success');
        await loadHorariosExistentes();
    } catch (error) {
        showAlert('Error al eliminar horario: ' + error.message, 'error');
    }
}

async function loadHorarioSemanal() {
    const select = document.getElementById('cursoHorarioSelect');
    select.innerHTML = '<option value="">Seleccionar curso para ver horario...</option>';
    
    cursos.forEach(curso => {
        const option = document.createElement('option');
        option.value = curso._id || curso.id;
        option.textContent = curso.nombre;
        select.appendChild(option);
    });
    
    select.addEventListener('change', async function() {
        if (this.value) {
            await mostrarHorarioDelCursoEnHorarios(this.value, this.options[this.selectedIndex].text);
        } else {
            document.getElementById('horarioSemanalContainer').style.display = 'none';
        }
    });
}

async function mostrarHorarioDelCursoEnHorarios(cursoId, cursoNombre) {
    try {
        const horarios = await apiRequest('/horarios');
        const horariosDelCurso = horarios.filter(h => h.curso_id == cursoId);
        
        // Mostrar el visor
        document.getElementById('horarioSemanalContainer').style.display = 'block';
        document.getElementById('cursoSeleccionadoHorarios').textContent = `Horario de ${cursoNombre}`;
        
        // Crear estructura de horarios por día y hora
        const horariosPorDia = {
            'Lunes': {},
            'Martes': {},
            'Miercoles': {},
            'Jueves': {},
            'Viernes': {}
        };
        
        // Organizar horarios
        horariosDelCurso.forEach(horario => {
            const asignatura = asignaturas.find(a => (a._id || a.id) == horario.asignatura_id);
            const horaKey = `${horario.hora_inicio}-${horario.hora_fin}`;
            
            if (horariosPorDia[horario.dia_semana]) {
                horariosPorDia[horario.dia_semana][horaKey] = {
                    materia: asignatura ? asignatura.nombre : 'Materia no encontrada',
                    aula: horario.aula || ''
                };
            }
        });
        
        // Obtener todas las horas únicas y ordenarlas
        const todasLasHoras = new Set();
        horariosDelCurso.forEach(h => {
            todasLasHoras.add(`${h.hora_inicio}-${h.hora_fin}`);
        });
        const horasOrdenadas = Array.from(todasLasHoras).sort();
        
        // Generar tabla
        const tbody = document.getElementById('horarioSemanalBody');
        tbody.innerHTML = '';
        
        if (horasOrdenadas.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" style="text-align: center; padding: 30px; color: #6c757d;"><i class="fas fa-calendar-times"></i> No hay horarios creados para este curso</td>';
            tbody.appendChild(row);
        } else {
            horasOrdenadas.forEach(hora => {
                const row = document.createElement('tr');
                const [inicio, fin] = hora.split('-');
                
                let rowHTML = `<td class="hora-col">${inicio} - ${fin}</td>`;
                
                ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'].forEach(dia => {
                    const horarioInfo = horariosPorDia[dia][hora];
                    if (horarioInfo) {
                        const aulaText = horarioInfo.aula ? ` (${horarioInfo.aula})` : '';
                        rowHTML += `<td class="materia-cell">${horarioInfo.materia}${aulaText}</td>`;
                    } else {
                        rowHTML += '<td class="empty-cell">Libre</td>';
                    }
                });
                
                row.innerHTML = rowHTML;
                tbody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error cargando horario del curso:', error);
        showAlert('Error al cargar el horario del curso', 'error');
    }
}

async function mostrarHorarioCurso(cursoId) {
    try {
        const horarios = await apiRequest('/horarios');
        const horariosDelCurso = horarios.filter(h => h.curso_id == cursoId);
        
        // Limpiar tabla
        document.querySelectorAll('.horario-cell').forEach(cell => {
            cell.textContent = '-';
        });
        
        // Llenar horarios
        horariosDelCurso.forEach(horario => {
            const asignatura = asignaturas.find(a => (a._id || a.id) == horario.asignatura_id);
            const horaKey = `${horario.hora_inicio}-${horario.hora_fin}`;
            const cell = document.querySelector(`[data-dia="${horario.dia_semana}"][data-hora="${horaKey}"]`);
            
            if (cell && asignatura) {
                cell.textContent = asignatura.nombre;
            }
        });
        
        document.getElementById('horarioSemanalContainer').style.display = 'block';
    } catch (error) {
        console.error('Error cargando horario del curso:', error);
    }
}

async function deshabilitarUsuario(userId) {
    const usuario = usuarios.find(u => (u._id == userId || u.id == userId));
    if (!usuario) {
        showAlert('Usuario no encontrado', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de deshabilitar a ${usuario.nombre} ${usuario.apellido}?\n\nEsto impedirá que pueda iniciar sesión.`)) {
        return;
    }
    
    try {
        // Obtener ID del admin desde currentUser
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const adminId = currentUser._id || currentUser.id;
        
        console.log('Admin ID:', adminId);
        console.log('Usuario a deshabilitar:', userId);
        
        if (!adminId) {
            throw new Error('No se pudo obtener el ID del administrador');
        }
        
        const response = await apiRequest(`/admin/deshabilitar-usuario/${userId}`, 'POST', { admin_id: adminId });
        
        if (response && response.success) {
            showAlert(`Usuario ${usuario.nombre} ${usuario.apellido} ha sido deshabilitado`, 'success');
            await loadUsuarios();
        } else {
            throw new Error(response.message || 'Error al deshabilitar usuario');
        }
    } catch (error) {
        console.error('Error al deshabilitar usuario:', error);
        showAlert('Error al deshabilitar usuario: ' + error.message, 'error');
    }
}

async function habilitarUsuario(userId) {
    const usuario = usuarios.find(u => (u._id == userId || u.id == userId));
    if (!usuario) {
        showAlert('Usuario no encontrado', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de habilitar a ${usuario.nombre} ${usuario.apellido}?`)) {
        return;
    }
    
    try {
        // Obtener ID del admin desde currentUser
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const adminId = currentUser._id || currentUser.id;
        
        console.log('Admin ID:', adminId);
        console.log('Usuario a habilitar:', userId);
        
        if (!adminId) {
            throw new Error('No se pudo obtener el ID del administrador');
        }
        
        const response = await apiRequest(`/admin/habilitar-usuario/${userId}`, 'POST', { admin_id: adminId });
        
        if (response && response.success) {
            showAlert(`Usuario ${usuario.nombre} ${usuario.apellido} ha sido habilitado`, 'success');
            await loadUsuarios();
        } else {
            throw new Error(response.message || 'Error al habilitar usuario');
        }
    } catch (error) {
        console.error('Error al habilitar usuario:', error);
        showAlert('Error al habilitar usuario: ' + error.message, 'error');
    }
}

function logout() {
    console.log('Cerrando sesión...');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.clear(); // Limpiar todo el localStorage
    window.location.href = 'index.html';
}

function closeEditAsistenciaModal() {
    const modal = document.getElementById('editAsistenciaModal');
    if (modal) {
        modal.remove();
    }
}

async function updateAsistenciaAdmin() {
    try {
        const id = document.getElementById('editAsistenciaId').value;
        const fecha = document.getElementById('editAsistenciaFecha').value;
        const estado = document.getElementById('editAsistenciaEstado').value;
        
        if (!fecha || !estado) {
            showAlert('Debe completar todos los campos', 'error');
            return;
        }
        
        const data = {
            fecha: fecha,
            estado: estado
        };
        
        console.log('Actualizando asistencia:', { id, data });
        
        const response = await apiRequest('/asistencias/' + id, 'PUT', data);
        console.log('Respuesta del servidor:', response);
        
        showAlert('Asistencia actualizada correctamente', 'success');
        closeEditAsistenciaModal();
        await loadAsistencias();
    } catch (error) {
        console.error('Error al actualizar asistencia:', error);
        showAlert('Error al actualizar asistencia: ' + error.message, 'error');
    }
}

function showAlert(message, type) {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    
    if (type === 'info' && message.includes('<')) {
        alert.innerHTML = message;
        alert.style.maxWidth = '600px';
        alert.style.cursor = 'pointer';
        alert.style.zIndex = '9999';
        alert.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') {
                alert.remove();
            }
        });
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 15000);
    } else {
        alert.textContent = message;
        setTimeout(() => {
            if (alert.parentNode) alert.remove();
        }, 5000);
    }

    const main = document.querySelector('.main');
    main.insertBefore(alert, main.firstChild);

    // Hacer funciones globales para los botones
    window.asignarCursoAlumno = asignarCursoAlumno;
}