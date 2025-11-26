const API_BASE_URL = 'https://edcontrol-backend.onrender.com/api';

let currentSection = 'dashboard';
let asignaturas = [];
let notas = [];
let asistencias = [];
let usuarios = [];

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadData().then(() => {
        loadDashboard();
    });
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
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    currentSection = section;
}

async function loadData() {
    try {
        usuarios = await fetch(`${API_BASE_URL}/usuarios`).then(res => res.json());
        await loadAsignaturas();
        await loadNotas();
        await loadAsistencias();
        loadAlumnosForFilter();
        loadMateriasForAsistenciaFilter();
        console.log('Datos cargados:', {
            usuarios: usuarios.length,
            asignaturas: asignaturas.length,
            notas: notas.length,
            asistencias: asistencias.length
        });
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadAsignaturas() {
    try {
        const currentUser = getCurrentUser();
        const allAsignaturas = await fetch(`${API_BASE_URL}/asignaturas`).then(res => res.json());
        
        console.log('Profesor actual:', currentUser);
        console.log('Todas las asignaturas:', allAsignaturas);
        
        // Filtrar asignaturas del profesor por diferentes campos
        asignaturas = allAsignaturas.filter(a => {
            const isAssigned = a.id_profesor === currentUser.id || 
                              a.id_profesor === currentUser._id ||
                              a.profesor_id === currentUser.id ||
                              a.profesor_id === currentUser._id ||
                              (a.profesor_nombre && a.profesor_nombre.includes(currentUser.nombre));
            
            console.log(`Asignatura ${a.nombre}: profesor_id=${a.id_profesor}, profesor_nombre=${a.profesor_nombre}, isAssigned=${isAssigned}`);
            return isAssigned;
        });
        
        console.log('Asignaturas del profesor:', asignaturas);
        renderAsignaturas();
    } catch (error) {
        console.error('Error loading asignaturas:', error);
    }
}

async function loadNotas() {
    try {
        notas = await fetch(`${API_BASE_URL}/notas`).then(res => res.json());
        renderNotas();
    } catch (error) {
        console.error('Error loading notas:', error);
    }
}

async function loadAsistencias() {
    try {
        asistencias = await fetch(`${API_BASE_URL}/asistencias`).then(res => res.json());
        renderAsistencias();
    } catch (error) {
        console.error('Error loading asistencias:', error);
    }
}

function loadAlumnosForFilter() {
    const alumnos = usuarios.filter(u => u.id_rol === 3);
    const select = document.getElementById('alumnoFilter');
    select.innerHTML = '<option value="">Todos los alumnos</option>';
    
    alumnos.forEach(alumno => {
        const option = document.createElement('option');
        option.value = alumno.id;
        option.textContent = `${alumno.nombre} ${alumno.apellido}`;
        select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
        renderNotas(e.target.value);
    });
}

function renderAsignaturas() {
    const container = document.querySelector('.subjects-grid');
    container.innerHTML = '';

    if (asignaturas.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-book" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>No tienes asignaturas asignadas</div>';
        return;
    }

    asignaturas.forEach(asignatura => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        
        // Mapear curso_id a nombre del curso
        let cursoNombre = 'Sin curso';
        if (asignatura.curso_id === 1) cursoNombre = '1° Básico';
        else if (asignatura.curso_id === 2) cursoNombre = '2° Básico';
        else if (asignatura.curso_id === 3) cursoNombre = '3° Básico';
        else if (asignatura.curso_id === 4) cursoNombre = '4° Básico';
        else if (asignatura.curso || asignatura.curso_nombre) {
            cursoNombre = asignatura.curso || asignatura.curso_nombre;
        }
        
        card.innerHTML = `
            <h3 class="subject-title">
                <i class="fas fa-book"></i>
                ${asignatura.nombre}
            </h3>
            <p class="subject-description">${asignatura.descripcion || 'Sin descripción disponible'}</p>
            <span class="subject-course">${cursoNombre}</span>
        `;
        container.appendChild(card);
    });
}

function renderNotas(filtroAlumno = '') {
    const tbody = document.querySelector('#notasTable tbody');
    tbody.innerHTML = '';

    // Filtrar notas de las asignaturas del profesor usando alumno_correo
    let notasFiltradas = notas.filter(n => {
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(n.asignatura_id) || 
            String(a._id) === String(n.asignatura_id)
        );
        return asignatura; // Solo notas de asignaturas del profesor
    });
    
    if (filtroAlumno) {
        const alumnoSeleccionado = usuarios.find(u => (u.id || u._id) == filtroAlumno);
        if (alumnoSeleccionado) {
            notasFiltradas = notasFiltradas.filter(n => n.alumno_correo === alumnoSeleccionado.correo);
        }
    }

    if (notasFiltradas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center; color: #666;">No hay notas disponibles</td>';
        tbody.appendChild(row);
        return;
    }

    notasFiltradas.forEach(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        
        // Buscar asignatura por ID
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        
        // Nombre del alumno
        const alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : nota.alumno_correo;
        
        // Nombre de la asignatura
        const nombreAsignatura = nota.materia_nombre || (asignatura ? asignatura.nombre : 'N/A');
        
        const row = document.createElement('tr');
        // Obtener curso del alumno
        const cursoAlumno = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'N/A';
        
        row.innerHTML = `
            <td>${alumnoNombre}</td>
            <td>${cursoAlumno}</td>
            <td>${nombreAsignatura}</td>
            <td><span class="grade-badge">${nota.valor}</span></td>
            <td>${formatDate(nota.fecha)}</td>
            <td>
                <button class="btn btn-warning" onclick="editNota('${nota._id || nota.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAsistencias() {
    const tbody = document.querySelector('#asistenciasTable tbody');
    tbody.innerHTML = '';

    // Filtrar asistencias de las asignaturas del profesor
    let asistenciasFiltradas = asistencias.filter(a => {
        // Filtrar por nombre de materia directamente
        const esDeProfesor = asignaturas.some(asig => 
            asig.nombre === a.materia_nombre
        );
        return esDeProfesor;
    });

    // Aplicar filtro de materia si existe
    const materiaFilter = document.getElementById('materiaAsistenciaFilter')?.value;
    if (materiaFilter) {
        asistenciasFiltradas = asistenciasFiltradas.filter(a => {
            return a.materia_nombre && a.materia_nombre.toLowerCase().includes(materiaFilter.toLowerCase());
        });
    }

    if (asistenciasFiltradas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" style="text-align: center; color: #666;">No hay asistencias disponibles</td>';
        tbody.appendChild(row);
        return;
    }

    asistenciasFiltradas.forEach(asistencia => {
        const alumno = usuarios.find(u => u.correo === asistencia.alumno_correo);
        const alumnoNombre = asistencia.alumno_nombre || (alumno ? `${alumno.nombre} ${alumno.apellido}` : asistencia.alumno_correo);
        const cursoAlumno = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'N/A';
        const asignaturaNombre = asistencia.materia_nombre || 'N/A';
        
        const row = document.createElement('tr');
        const asistenciaId = asistencia._id || asistencia.id;
        row.setAttribute('data-asistencia-id', asistenciaId);
        row.innerHTML = `
            <td>${alumnoNombre}</td>
            <td>${cursoAlumno}</td>
            <td>${asignaturaNombre}</td>
            <td>${formatDate(asistencia.fecha)}</td>
            <td><span class="status-${asistencia.estado.toLowerCase()}">${asistencia.estado}</span></td>
            <td>
                <button class="btn btn-warning" onclick="editAsistencia('${asistenciaId}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteAsistenciaRecord('${asistenciaId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getCurrentUser() {
    const userId = localStorage.getItem('userId');
    console.log('UserId from localStorage:', userId);
    
    let user = usuarios.find(u => String(u.id) === String(userId)) ||
               usuarios.find(u => String(u._id) === String(userId));
    
    console.log('Current professor found:', user);
    
    // Fallback para testing
    if (!user) {
        user = usuarios.find(u => u.id_rol === 2);
        console.log('Fallback professor user:', user);
    }
    
    return user || {};
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => input.value = '');
    }

    if (modalId === 'notaModal') {
        document.getElementById('notaFecha').value = new Date().toISOString().split('T')[0];
        loadAlumnosAndAsignaturasForNota();
    }
    if (modalId === 'asistenciaModal') {
        document.getElementById('asistenciaFecha').value = new Date().toISOString().split('T')[0];
        loadAlumnosAndAsignaturasForAsistencia();
        document.getElementById('estudiantesList').innerHTML = '';
    }
}

function loadAlumnosAndAsignaturasForNota() {
    // Obtener cursos de las asignaturas del profesor
    const cursosProfesor = new Set();
    asignaturas.forEach(asig => {
        if (asig.curso_id === 1) cursosProfesor.add('1° Básico');
        else if (asig.curso_id === 2) cursosProfesor.add('2° Básico');
        else if (asig.curso_id === 3) cursosProfesor.add('3° Básico');
        else if (asig.curso_id === 4) cursosProfesor.add('4° Básico');
        else if (asig.curso || asig.curso_nombre) {
            cursosProfesor.add(asig.curso || asig.curso_nombre);
        }
    });
    
    // Filtrar solo alumnos de los cursos del profesor
    const todosLosAlumnos = usuarios.filter(u => {
        if (u.id_rol !== 3) return false;
        const cursoAlumno = u.curso || u.curso_nombre;
        return cursoAlumno && cursosProfesor.has(cursoAlumno);
    }).sort((a, b) => {
        const cursoA = a.curso || a.curso_nombre || 'ZZZ';
        const cursoB = b.curso || b.curso_nombre || 'ZZZ';
        if (cursoA !== cursoB) return cursoA.localeCompare(cursoB);
        return `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
    });
    
    const alumnoSelect = document.getElementById('notaAlumno');
    alumnoSelect.innerHTML = '<option value="">📚 Seleccionar alumno...</option>';
    
    // Agrupar por curso
    const alumnosPorCurso = {};
    todosLosAlumnos.forEach(alumno => {
        const curso = alumno.curso || alumno.curso_nombre || 'Sin curso';
        if (!alumnosPorCurso[curso]) {
            alumnosPorCurso[curso] = [];
        }
        alumnosPorCurso[curso].push(alumno);
    });
    
    // Crear optgroups por curso
    Object.entries(alumnosPorCurso).forEach(([curso, alumnos]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `🎓 ${curso}`;
        
        alumnos.forEach(alumno => {
            const option = document.createElement('option');
            option.value = alumno._id || alumno.id;
            option.textContent = `${alumno.nombre} ${alumno.apellido}`;
            optgroup.appendChild(option);
        });
        
        alumnoSelect.appendChild(optgroup);
    });
    
    // Cargar asignaturas del profesor
    const asignaturaSelect = document.getElementById('notaAsignatura');
    asignaturaSelect.innerHTML = '<option value="">📖 Seleccionar asignatura...</option>';
    
    asignaturas.forEach(asignatura => {
        const option = document.createElement('option');
        option.value = asignatura._id || asignatura.id;
        
        // Mapear curso_id a nombre del curso
        let cursoNombre = 'N/A';
        if (asignatura.curso_id === 1) cursoNombre = '1° Básico';
        else if (asignatura.curso_id === 2) cursoNombre = '2° Básico';
        else if (asignatura.curso_id === 3) cursoNombre = '3° Básico';
        else if (asignatura.curso_id === 4) cursoNombre = '4° Básico';
        else if (asignatura.curso || asignatura.curso_nombre) {
            cursoNombre = asignatura.curso || asignatura.curso_nombre;
        }
        
        option.textContent = `📐 ${asignatura.nombre} - 🎓 ${cursoNombre}`;
        asignaturaSelect.appendChild(option);
    });
    
    // Event listener para mostrar asignatura seleccionada con descripción
    asignaturaSelect.addEventListener('change', function() {
        const selectedAsignatura = asignaturas.find(a => (a._id || a.id) == this.value);
        const display = document.getElementById('asignaturaSeleccionada');
        if (display && selectedAsignatura) {
            const descripcion = selectedAsignatura.descripcion || 'Sin descripción disponible';
            
            // Mapear curso_id a nombre del curso
            let cursoNombre = 'N/A';
            if (selectedAsignatura.curso_id === 1) cursoNombre = '1° Básico';
            else if (selectedAsignatura.curso_id === 2) cursoNombre = '2° Básico';
            else if (selectedAsignatura.curso_id === 3) cursoNombre = '3° Básico';
            else if (selectedAsignatura.curso_id === 4) cursoNombre = '4° Básico';
            else if (selectedAsignatura.curso || selectedAsignatura.curso_nombre) {
                cursoNombre = selectedAsignatura.curso || selectedAsignatura.curso_nombre;
            }
            
            display.innerHTML = `
                <div class="subject-info">
                    <h4>📐 ${selectedAsignatura.nombre}</h4>
                    <p class="subject-description">📝 ${descripcion}</p>
                    <span class="subject-course">🎓 Curso: ${cursoNombre}</span>
                </div>
            `;
            display.style.display = 'block';
        } else if (display) {
            display.style.display = 'none';
        }
    });
}

function loadAlumnosAndAsignaturasForAsistencia() {
    // Cargar asignaturas del profesor agrupadas por curso
    const asignaturaSelect = document.getElementById('asistenciaAsignatura');
    asignaturaSelect.innerHTML = '<option value="">📖 Seleccionar asignatura por curso...</option>';
    
    // Debug: mostrar asignaturas disponibles
    console.log('=== DEBUG ASIGNATURAS ===');
    console.log('Total asignaturas:', asignaturas.length);
    asignaturas.forEach((a, index) => {
        console.log(`Asignatura ${index + 1}:`, {
            nombre: a.nombre,
            todosLosCampos: Object.keys(a),
            valoresCampos: a
        });
    });
    console.log('========================');
    
    // Agrupar asignaturas por curso usando TODOS los campos posibles
    const asignaturasPorCurso = {};
    asignaturas.forEach(asignatura => {
        const curso = asignatura.curso || 
                     asignatura.id_curso || 
                     asignatura.curso_nombre ||
                     asignatura.curso_id ||
                     asignatura.grado ||
                     asignatura.nivel ||
                     asignatura.course ||
                     asignatura.grade ||
                     'Sin curso';
        
        if (!asignaturasPorCurso[curso]) {
            asignaturasPorCurso[curso] = [];
        }
        asignaturasPorCurso[curso].push(asignatura);
    });
    
    console.log('Asignaturas agrupadas por curso:', asignaturasPorCurso);
    
    // Crear optgroups por curso
    Object.entries(asignaturasPorCurso).forEach(([curso, asignaturasDelCurso]) => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `🎓 ${curso}`;
        
        asignaturasDelCurso.forEach(asignatura => {
            const option = document.createElement('option');
            option.value = asignatura._id || asignatura.id;
            const descripcionCorta = asignatura.descripcion ? 
                (asignatura.descripcion.length > 50 ? 
                    asignatura.descripcion.substring(0, 50) + '...' : 
                    asignatura.descripcion) : 'Sin descripción';
            option.textContent = `📐 ${asignatura.nombre} - ${descripcionCorta}`;
            optgroup.appendChild(option);
        });
        
        asignaturaSelect.appendChild(optgroup);
    });
    
    // Event listener para cargar estudiantes del curso cuando se selecciona asignatura
    asignaturaSelect.addEventListener('change', function() {
        const selectedAsignatura = asignaturas.find(a => (a._id || a.id) == this.value);
        if (selectedAsignatura) {
            loadEstudiantesPorCurso(selectedAsignatura);
        } else {
            document.getElementById('estudiantesList').innerHTML = '';
        }
    });
}

function loadEstudiantesPorCurso(asignatura) {
    console.log('=== DEBUG COMPLETO ===');
    console.log('Asignatura seleccionada:', asignatura);
    
    // La asignatura tiene curso_id, necesitamos mapear a nombre del curso
    const cursoId = asignatura.curso_id;
    console.log('Curso ID de la asignatura:', cursoId);
    
    // Mapear curso_id a nombre del curso
    let cursoNombre = '';
    if (cursoId === 1) cursoNombre = '1° Básico';
    else if (cursoId === 2) cursoNombre = '2° Básico';
    else if (cursoId === 3) cursoNombre = '3° Básico';
    else if (cursoId === 4) cursoNombre = '4° Básico';
    
    console.log('Curso nombre mapeado:', cursoNombre);
    
    // Filtrar estudiantes del curso específico
    const estudiantesCurso = usuarios.filter(u => {
        if (u.id_rol !== 3) return false;
        
        const cursoEstudiante = u.curso_nombre || u.curso;
        console.log(`${u.nombre} ${u.apellido}: curso="${cursoEstudiante}" vs asignatura="${cursoNombre}"`);
        
        return cursoEstudiante && cursoNombre && 
               String(cursoEstudiante).trim() === String(cursoNombre).trim();
    }).sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`));
    
    console.log('Estudiantes filtrados:', estudiantesCurso.length);
    
    const container = document.getElementById('estudiantesList');
    container.innerHTML = '';
    
    // Header con información de la asignatura
    const header = document.createElement('div');
    header.className = 'attendance-header';
    const descripcion = asignatura.descripcion || 'Sin descripción disponible';
    header.innerHTML = `
        <div class="subject-header-info">
            <h4>📐 ${asignatura.nombre}</h4>
            <p class="subject-description">📝 ${descripcion}</p>
            <span class="course-info">🎓 Curso: ${cursoNombre || 'No definido'} | 👥 ${estudiantesCurso.length} estudiantes</span>
        </div>
        <div class="attendance-actions">
            <button type="button" class="btn btn-success" onclick="marcarTodosPresentes()">✅ Todos Presentes</button>
            <button type="button" class="btn btn-danger" onclick="marcarTodosAusentes()">❌ Todos Ausentes</button>
        </div>
    `;
    container.appendChild(header);
    
    if (estudiantesCurso.length === 0) {
        const noStudents = document.createElement('div');
        noStudents.className = 'no-students';
        noStudents.innerHTML = `
            <i class="fas fa-users" style="font-size: 2rem; color: #dee2e6; margin-bottom: 10px;"></i>
            <p>No hay estudiantes en el curso <strong>${cursoNombre || 'sin definir'}</strong></p>
            <small>Verifique que los estudiantes tengan el curso correctamente asignado</small>
        `;
        container.appendChild(noStudents);
        return;
    }
    
    // Mostrar estudiantes del curso
    estudiantesCurso.forEach(estudiante => {
        const cursoEstudiante = estudiante.curso_nombre || estudiante.curso || estudiante.id_curso || 'Sin curso';
        const row = document.createElement('div');
        row.className = 'attendance-row';
        row.innerHTML = `
            <div class="student-info">
                <span class="student-name">👤 ${estudiante.nombre} ${estudiante.apellido}</span>
                <small style="color: #6c757d; margin-left: 10px;">Curso: ${cursoEstudiante}</small>
            </div>
            <div class="attendance-options">
                <label class="attendance-option">
                    <input type="radio" name="attendance_${estudiante._id || estudiante.id}" value="Presente" checked>
                    <span class="option-label presente">✅ Presente</span>
                </label>
                <label class="attendance-option">
                    <input type="radio" name="attendance_${estudiante._id || estudiante.id}" value="Ausente">
                    <span class="option-label ausente">❌ Ausente</span>
                </label>
                <label class="attendance-option">
                    <input type="radio" name="attendance_${estudiante._id || estudiante.id}" value="Justificado">
                    <span class="option-label justificado">📝 Justificado</span>
                </label>
            </div>
        `;
        container.appendChild(row);
    });
    
    const saveButton = document.createElement('div');
    saveButton.className = 'attendance-save';
    saveButton.innerHTML = `
        <button type="button" class="btn btn-primary btn-large" onclick="guardarAsistenciaCompleta()">
            💾 Guardar Asistencia Completa
        </button>
    `;
    container.appendChild(saveButton);
    
    console.log('===================');
}

function marcarTodosPresentes() {
    document.querySelectorAll('input[type="radio"][value="Presente"]').forEach(radio => {
        radio.checked = true;
    });
}

function marcarTodosAusentes() {
    document.querySelectorAll('input[type="radio"][value="Ausente"]').forEach(radio => {
        radio.checked = true;
    });
}

async function guardarAsistenciaCompleta() {
    try {
        const asignaturaId = document.getElementById('asistenciaAsignatura').value;
        const fecha = document.getElementById('asistenciaFecha').value;
        
        if (!asignaturaId || !fecha) {
            showAlert('Debe seleccionar asignatura y fecha', 'error');
            return;
        }
        
        const asistencias = [];
        const radioGroups = {};
        
        // Agrupar radios por estudiante
        document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            const studentId = radio.name.replace('attendance_', '');
            const estado = radio.value;
            asistencias.push({
                alumno_id: studentId,
                asignatura_id: asignaturaId,
                fecha: fecha,
                estado: estado
            });
        });
        
        if (asistencias.length === 0) {
            showAlert('No hay estudiantes para registrar asistencia', 'error');
            return;
        }
        
        // Guardar cada asistencia
        let exitosas = 0;
        for (const asistencia of asistencias) {
            try {
                const response = await fetch(`${API_BASE_URL}/web/asistencias`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(asistencia)
                });
                
                if (response.ok) exitosas++;
            } catch (error) {
                console.error('Error guardando asistencia individual:', error);
            }
        }
        
        showAlert(`Asistencia guardada: ${exitosas}/${asistencias.length} registros exitosos`, 'success');
        closeModal('asistenciaModal');
        await loadAsistencias();
        
    } catch (error) {
        console.error('Error al guardar asistencia completa:', error);
        showAlert('Error al guardar asistencia: ' + error.message, 'error');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function setupForms() {
    document.getElementById('notaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveNota();
    });

    document.getElementById('asistenciaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAsistencia();
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
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
            tipo_evaluacion: tipoEvaluacion
        };

        // Obtener datos de la asignatura para el correo
        const asignatura = asignaturas.find(a => (a._id || a.id) == asignaturaId);
        
        console.log('Guardando nota:', { id, data, alumno: alumno?.nombre, asignatura: asignatura?.nombre });

        let response;
        if (id) {
            // Actualizar nota existente
            response = await fetch(`${API_BASE_URL}/notas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } else {
            // Crear nueva nota
            response = await fetch(`${API_BASE_URL}/web/notas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        
        showAlert(id ? 'Nota actualizada correctamente' : 'Nota creada correctamente y correos enviados', 'success');
        closeModal('notaModal');
        await loadNotas();
    } catch (error) {
        console.error('Error al guardar nota:', error);
        showAlert('Error al guardar nota: ' + error.message, 'error');
    }
}

async function saveAsistencia() {
    try {
        const data = {
            alumno_id: document.getElementById('asistenciaAlumno').value,
            asignatura_id: document.getElementById('asistenciaAsignatura').value,
            fecha: document.getElementById('asistenciaFecha').value,
            estado: document.getElementById('asistenciaEstado').value
        };

        console.log('Guardando asistencia:', data);

        const response = await fetch(`${API_BASE_URL}/web/asistencias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        showAlert('Asistencia registrada correctamente', 'success');
        closeModal('asistenciaModal');
        await loadAsistencias();
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        showAlert('Error al registrar asistencia: ' + error.message, 'error');
    }
}

async function editNota(id) {
    const nota = notas.find(n => (n.id === id || n._id === id));
    if (!nota) {
        console.error('Nota no encontrada:', id);
        showAlert('Nota no encontrada', 'error');
        return;
    }

    console.log('Editando nota:', nota);
    
    openModal('notaModal');
    
    // Esperar a que el modal se abra y los selects se carguen
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

async function loadDashboard() {
    try {
        console.log('Cargando dashboard...');
        
        // Filtrar notas solo de las asignaturas del profesor
        const notasProfesor = notas.filter(nota => {
            return asignaturas.some(asig => 
                String(asig.id) === String(nota.asignatura_id) || 
                String(asig._id) === String(nota.asignatura_id)
            );
        });
        
        // Cargar selector de cursos
        loadCursoSelector(notasProfesor);
        
        // Cargar dashboard general por defecto
        loadDashboardGeneral(notasProfesor);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function loadDashboardGeneral(notasProfesor) {
    // Calcular estadísticas generales
    const totalAsignaturas = asignaturas.length;
    const totalNotas = notasProfesor.length;
    
    // Filtrar asistencias del profesor
    const asistenciasProfesor = asistencias.filter(asistencia => {
        return asignaturas.some(asig => 
            String(asig.id) === String(asistencia.asignatura_id) || 
            String(asig._id) === String(asistencia.asignatura_id)
        );
    });
    
    // Obtener estudiantes únicos
    const estudiantesUnicos = new Set();
    notasProfesor.forEach(nota => {
        if (nota.alumno_correo) {
            estudiantesUnicos.add(nota.alumno_correo);
        }
    });
    const totalEstudiantes = estudiantesUnicos.size;
    
    // Calcular promedio general
    const sumaNotas = notasProfesor.reduce((sum, nota) => sum + parseFloat(nota.valor || 0), 0);
    const promedioGeneral = totalNotas > 0 ? (sumaNotas / totalNotas).toFixed(1) : '0.0';
    
    // Calcular estadísticas de asistencia
    const totalAsistencias = asistenciasProfesor.length;
    const asistenciasPresentes = asistenciasProfesor.filter(a => a.estado === 'Presente').length;
    const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((asistenciasPresentes / totalAsistencias) * 100) : 0;
    
    // Actualizar estadísticas en el DOM con verificación de null
    const totalAsignaturasEl = document.getElementById('totalAsignaturas');
    const totalEstudiantesEl = document.getElementById('totalEstudiantes');
    const totalNotasEl = document.getElementById('totalNotas');
    const promedioGeneralEl = document.getElementById('promedioGeneral');
    const totalAsistenciasEl = document.getElementById('totalAsistencias');
    const porcentajeAsistenciaEl = document.getElementById('porcentajeAsistencia');
    
    if (totalAsignaturasEl) totalAsignaturasEl.textContent = totalAsignaturas;
    if (totalEstudiantesEl) totalEstudiantesEl.textContent = totalEstudiantes;
    if (totalNotasEl) totalNotasEl.textContent = totalNotas;
    if (promedioGeneralEl) promedioGeneralEl.textContent = promedioGeneral;
    if (totalAsistenciasEl) totalAsistenciasEl.textContent = totalAsistencias;
    if (porcentajeAsistenciaEl) porcentajeAsistenciaEl.textContent = porcentajeAsistencia + '%';
    
    // Cargar componentes del dashboard
    loadNotasPorCurso(notasProfesor);
    loadAsistenciasPorCurso(asistenciasProfesor);
    loadActividadReciente(notasProfesor);
}

function filtrarDashboardPorCurso(cursoSeleccionado, notasProfesor) {
    // Filtrar notas del curso específico
    const notasCurso = notasProfesor.filter(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        return alumno && (alumno.curso === cursoSeleccionado || alumno.curso_nombre === cursoSeleccionado);
    });
    
    // Filtrar asistencias del curso
    const asistenciasCurso = asistencias.filter(asistencia => {
        const alumno = usuarios.find(u => u.correo === asistencia.alumno_correo);
        const esDelProfesor = asignaturas.some(asig => 
            String(asig.id) === String(asistencia.asignatura_id) || 
            String(asig._id) === String(asistencia.asignatura_id)
        );
        return alumno && esDelProfesor && (alumno.curso === cursoSeleccionado || alumno.curso_nombre === cursoSeleccionado);
    });
    
    // Filtrar estudiantes del curso
    const estudiantesCurso = usuarios.filter(u => 
        u.id_rol === 3 && (u.curso === cursoSeleccionado || u.curso_nombre === cursoSeleccionado)
    );
    
    // Filtrar asignaturas que tienen notas en este curso
    const asignaturasCurso = asignaturas.filter(asig => {
        return notasCurso.some(nota => 
            String(asig.id) === String(nota.asignatura_id) || 
            String(asig._id) === String(nota.asignatura_id)
        );
    });
    
    // Calcular estadísticas del curso
    const totalAsignaturasCurso = asignaturasCurso.length;
    const totalNotasCurso = notasCurso.length;
    const totalEstudiantesCurso = estudiantesCurso.length;
    const totalAsistenciasCurso = asistenciasCurso.length;
    
    const promedioCurso = totalNotasCurso > 0 ? 
        (notasCurso.reduce((sum, nota) => sum + parseFloat(nota.valor || 0), 0) / totalNotasCurso).toFixed(1) : '0.0';
    
    const asistenciasPresentes = asistenciasCurso.filter(a => a.estado === 'Presente').length;
    const porcentajeAsistenciaCurso = totalAsistenciasCurso > 0 ? Math.round((asistenciasPresentes / totalAsistenciasCurso) * 100) : 0;
    
    // Actualizar estadísticas principales con datos del curso con verificación de null
    const totalAsignaturasEl = document.getElementById('totalAsignaturas');
    const totalEstudiantesEl = document.getElementById('totalEstudiantes');
    const totalNotasEl = document.getElementById('totalNotas');
    const promedioGeneralEl = document.getElementById('promedioGeneral');
    const totalAsistenciasEl = document.getElementById('totalAsistencias');
    const porcentajeAsistenciaEl = document.getElementById('porcentajeAsistencia');
    
    if (totalAsignaturasEl) totalAsignaturasEl.textContent = totalAsignaturasCurso;
    if (totalEstudiantesEl) totalEstudiantesEl.textContent = totalEstudiantesCurso;
    if (totalNotasEl) totalNotasEl.textContent = totalNotasCurso;
    if (promedioGeneralEl) promedioGeneralEl.textContent = promedioCurso;
    if (totalAsistenciasEl) totalAsistenciasEl.textContent = totalAsistenciasCurso;
    if (porcentajeAsistenciaEl) porcentajeAsistenciaEl.textContent = porcentajeAsistenciaCurso + '%';
    
    // Actualizar componentes del dashboard con datos filtrados
    loadNotasPorCursoFiltrado(notasCurso, cursoSeleccionado);
    loadAsistenciasPorCursoFiltrado(asistenciasCurso, cursoSeleccionado);
    loadActividadRecienteFiltrada(notasCurso);
    
    // Mostrar análisis específico del curso
    mostrarAnalisisCurso(cursoSeleccionado, notasProfesor);
}

function loadNotasPorCursoFiltrado(notasCurso, cursoSeleccionado) {
    const container = document.getElementById('notasPorCurso');
    container.innerHTML = '';
    
    // Agrupar notas por asignatura en el curso
    const notasPorAsignatura = {};
    
    notasCurso.forEach(nota => {
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        const nombreAsignatura = nota.materia_nombre || (asignatura ? asignatura.nombre : 'Asignatura');
        
        if (!notasPorAsignatura[nombreAsignatura]) {
            notasPorAsignatura[nombreAsignatura] = {
                notas: [],
                estudiantes: new Set()
            };
        }
        
        notasPorAsignatura[nombreAsignatura].notas.push(parseFloat(nota.valor || 0));
        if (nota.alumno_correo) {
            notasPorAsignatura[nombreAsignatura].estudiantes.add(nota.alumno_correo);
        }
    });
    
    // Crear tarjetas para cada asignatura
    Object.entries(notasPorAsignatura).forEach(([asignatura, data]) => {
        const promedio = data.notas.length > 0 ? 
            (data.notas.reduce((sum, nota) => sum + nota, 0) / data.notas.length).toFixed(1) : '0.0';
        
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header">
                <h4 class="course-name">📚 ${asignatura}</h4>
                <span class="course-students">${data.estudiantes.size} estudiantes</span>
            </div>
            <div class="course-stats">
                <div class="course-stat">
                    <h3 class="course-stat-value">${promedio}</h3>
                    <p class="course-stat-label">Promedio</p>
                </div>
                <div class="course-stat">
                    <h3 class="course-stat-value">${data.notas.length}</h3>
                    <p class="course-stat-label">Notas</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (Object.keys(notasPorAsignatura).length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>No hay notas registradas en ${cursoSeleccionado}</div>`;
    }
}

function loadActividadRecienteFiltrada(notasCurso) {
    const container = document.getElementById('actividadReciente');
    container.innerHTML = '';
    
    // Obtener las últimas 5 notas del curso
    const notasRecientes = [...notasCurso]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
    
    if (notasRecientes.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>No hay actividad reciente en este curso</div>';
        return;
    }
    
    notasRecientes.forEach(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        
        const alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : nota.alumno_correo;
        const asignaturaNombre = nota.materia_nombre || (asignatura ? asignatura.nombre : 'Asignatura');
        
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-star"></i>
            </div>
            <div class="activity-content">
                <h4 class="activity-title">✨ Nota registrada: ${nota.valor}</h4>
                <p class="activity-description">👨‍🎓 ${alumnoNombre} - 📚 ${asignaturaNombre}</p>
            </div>
            <div class="activity-time">
                ${formatDate(nota.fecha)}
            </div>
        `;
        container.appendChild(item);
    });
}

function loadCursoSelector(notasProfesor) {
    const select = document.getElementById('cursoAnalisisSelect');
    select.innerHTML = '<option value="">📊 Ver todos los cursos</option>';
    
    // Obtener cursos únicos de los estudiantes con notas del profesor
    const cursosConNotas = new Set();
    notasProfesor.forEach(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        if (alumno && (alumno.curso || alumno.curso_nombre)) {
            cursosConNotas.add(alumno.curso || alumno.curso_nombre);
        }
    });
    
    console.log('Cursos encontrados:', Array.from(cursosConNotas));
    
    Array.from(cursosConNotas).sort().forEach(curso => {
        const option = document.createElement('option');
        option.value = curso;
        option.textContent = `🎓 ${curso}`;
        select.appendChild(option);
    });
    
    // Event listener para cambio de curso
    select.addEventListener('change', function() {
        if (this.value) {
            // Filtrar dashboard por curso
            filtrarDashboardPorCurso(this.value, notasProfesor);
            document.getElementById('analisisCurso').style.display = 'block';
            document.getElementById('resumenCursos').style.display = 'none';
        } else {
            // Mostrar dashboard general
            loadDashboardGeneral(notasProfesor);
            document.getElementById('analisisCurso').style.display = 'none';
            document.getElementById('resumenCursos').style.display = 'block';
        }
    });
}

function mostrarAnalisisCurso(cursoSeleccionado, notasProfesor) {
    // Actualizar título con verificación de null
    const cursoSeleccionadoNombreEl = document.getElementById('cursoSeleccionadoNombre');
    if (cursoSeleccionadoNombreEl) cursoSeleccionadoNombreEl.textContent = cursoSeleccionado;
    
    // Filtrar estudiantes del curso
    const estudiantesCurso = usuarios.filter(u => 
        u.id_rol === 3 && (u.curso === cursoSeleccionado || u.curso_nombre === cursoSeleccionado)
    );
    
    // Filtrar notas del curso (solo del profesor)
    const notasCurso = notasProfesor.filter(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        return alumno && (alumno.curso === cursoSeleccionado || alumno.curso_nombre === cursoSeleccionado);
    });
    
    // Calcular estadísticas avanzadas del curso
    const totalEstudiantesCurso = estudiantesCurso.length;
    const totalNotasCurso = notasCurso.length;
    const promedioCurso = totalNotasCurso > 0 ? 
        (notasCurso.reduce((sum, nota) => sum + parseFloat(nota.valor || 0), 0) / totalNotasCurso).toFixed(1) : '0.0';
    
    // Análisis detallado por estudiante
    const estudiantesConPromedio = {};
    const estudiantesConAsistencia = {};
    
    notasCurso.forEach(nota => {
        if (!estudiantesConPromedio[nota.alumno_correo]) {
            estudiantesConPromedio[nota.alumno_correo] = {
                notas: [],
                ultimaNota: null,
                fechaUltimaNota: null,
                tendencia: 'estable'
            };
        }
        estudiantesConPromedio[nota.alumno_correo].notas.push({
            valor: parseFloat(nota.valor || 0),
            fecha: new Date(nota.fecha)
        });
    });
    
    // Calcular tendencias y estadísticas avanzadas
    let estudiantesEnRiesgo = 0;
    let estudiantesExcelentes = 0;
    let estudiantesInactivos = 0;
    
    Object.keys(estudiantesConPromedio).forEach(correo => {
        const data = estudiantesConPromedio[correo];
        data.notas.sort((a, b) => a.fecha - b.fecha);
        
        const promedio = data.notas.reduce((sum, nota) => sum + nota.valor, 0) / data.notas.length;
        data.promedio = promedio;
        data.ultimaNota = data.notas[data.notas.length - 1];
        
        // Calcular tendencia (últimas 3 notas vs primeras 3)
        if (data.notas.length >= 3) {
            const primeras3 = data.notas.slice(0, 3).reduce((sum, n) => sum + n.valor, 0) / 3;
            const ultimas3 = data.notas.slice(-3).reduce((sum, n) => sum + n.valor, 0) / 3;
            
            if (ultimas3 > primeras3 + 0.5) data.tendencia = 'mejorando';
            else if (ultimas3 < primeras3 - 0.5) data.tendencia = 'empeorando';
        }
        
        // Clasificar estudiantes
        if (promedio < 4.0) estudiantesEnRiesgo++;
        else if (promedio >= 6.0) estudiantesExcelentes++;
        
        // Detectar inactividad (sin notas en últimos 30 días)
        const ultimaFecha = data.ultimaNota.fecha;
        const diasSinNotas = (new Date() - ultimaFecha) / (1000 * 60 * 60 * 24);
        if (diasSinNotas > 30) estudiantesInactivos++;
    });
    
    // Actualizar estadísticas en el DOM con verificación de null
    const estudiantesCursoEl = document.getElementById('estudiantesCurso');
    const promedioCursoEl = document.getElementById('promedioCurso');
    const notasCursoEl = document.getElementById('notasCurso');
    const estudiantesRiesgoEl = document.getElementById('estudiantesRiesgo');
    const estudiantesExcelentesEl = document.getElementById('estudiantesExcelentes');
    const estudiantesInactivosEl = document.getElementById('estudiantesInactivos');
    
    if (estudiantesCursoEl) estudiantesCursoEl.textContent = totalEstudiantesCurso;
    if (promedioCursoEl) promedioCursoEl.textContent = promedioCurso;
    if (notasCursoEl) notasCursoEl.textContent = totalNotasCurso;
    if (estudiantesRiesgoEl) estudiantesRiesgoEl.textContent = estudiantesEnRiesgo;
    if (estudiantesExcelentesEl) estudiantesExcelentesEl.textContent = estudiantesExcelentes;
    if (estudiantesInactivosEl) estudiantesInactivosEl.textContent = estudiantesInactivos;
    
    // Cargar análisis detallado
    loadAnalisisDetallado(cursoSeleccionado, estudiantesConPromedio, notasCurso);
    loadRendimientoEstudiantes(cursoSeleccionado, estudiantesConPromedio);
}

function loadRendimientoEstudiantes(curso, estudiantesConPromedio) {
    const container = document.getElementById('estudiantesRendimiento');
    container.innerHTML = '';
    
    // Obtener estudiantes del curso
    const estudiantesCurso = usuarios.filter(u => 
        u.id_rol === 3 && (u.curso === curso || u.curso_nombre === curso)
    );
    
    if (estudiantesCurso.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">📚 No hay estudiantes en este curso</div>';
        return;
    }
    
    // Ordenar estudiantes por promedio (descendente)
    const estudiantesOrdenados = estudiantesCurso.map(estudiante => {
        const data = estudiantesConPromedio[estudiante.correo];
        return {
            ...estudiante,
            data: data || { notas: [], promedio: 0, tendencia: 'sin-datos' }
        };
    }).sort((a, b) => (b.data.promedio || 0) - (a.data.promedio || 0));
    
    estudiantesOrdenados.forEach((estudiante, index) => {
        const data = estudiante.data;
        const promedio = data.promedio ? data.promedio.toFixed(1) : '0.0';
        
        // Determinar estado y tendencia
        let estadoClass = '';
        let estadoPromedio = '';
        let tendenciaIcon = '📊';
        let tendenciaColor = '#6c757d';
        
        if (parseFloat(promedio) >= 6.0) {
            estadoClass = 'excellent';
            estadoPromedio = 'excellent';
        } else if (parseFloat(promedio) < 4.0) {
            estadoClass = 'at-risk';
            estadoPromedio = 'at-risk';
        }
        
        // Iconos de tendencia
        if (data.tendencia === 'mejorando') {
            tendenciaIcon = '📈';
            tendenciaColor = '#28a745';
        } else if (data.tendencia === 'empeorando') {
            tendenciaIcon = '📉';
            tendenciaColor = '#dc3545';
        }
        
        // Ranking
        let rankingIcon = '🥉';
        if (index === 0) rankingIcon = '🥇';
        else if (index === 1) rankingIcon = '🥈';
        
        const ultimaNota = data.ultimaNota ? data.ultimaNota.valor : 'N/A';
        const diasSinNota = data.ultimaNota ? 
            Math.floor((new Date() - data.ultimaNota.fecha) / (1000 * 60 * 60 * 24)) : 'N/A';
        
        const card = document.createElement('div');
        card.className = `student-card ${estadoClass}`;
        card.innerHTML = `
            <div class="student-header">
                <div class="student-info">
                    <span class="student-ranking">${rankingIcon}</span>
                    <h5 class="student-name">${estudiante.nombre} ${estudiante.apellido}</h5>
                </div>
                <span class="student-average ${estadoPromedio}">${promedio}</span>
            </div>
            <div class="student-stats">
                <div class="student-stat">
                    <i class="fas fa-clipboard-list"></i>
                    <span>${data.notas.length} notas</span>
                </div>
                <div class="student-stat">
                    <i class="fas fa-star"></i>
                    <span>Última: ${ultimaNota}</span>
                </div>
                <div class="student-stat">
                    <span style="color: ${tendenciaColor}">${tendenciaIcon}</span>
                    <span>${data.tendencia.replace('-', ' ')}</span>
                </div>
                <div class="student-stat">
                    <i class="fas fa-clock"></i>
                    <span>${diasSinNota !== 'N/A' ? `${diasSinNota}d` : 'N/A'}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function loadAnalisisDetallado(curso, estudiantesConPromedio, notasCurso) {
    // Análisis por asignatura
    const analisisPorAsignatura = {};
    
    notasCurso.forEach(nota => {
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        const nombreAsignatura = nota.materia_nombre || (asignatura ? asignatura.nombre : 'Asignatura');
        
        if (!analisisPorAsignatura[nombreAsignatura]) {
            analisisPorAsignatura[nombreAsignatura] = {
                notas: [],
                estudiantes: new Set()
            };
        }
        
        analisisPorAsignatura[nombreAsignatura].notas.push(parseFloat(nota.valor));
        analisisPorAsignatura[nombreAsignatura].estudiantes.add(nota.alumno_correo);
    });
    
    // Mostrar análisis detallado
    const container = document.getElementById('analisisDetallado');
    if (container) {
        container.innerHTML = '';
        
        Object.entries(analisisPorAsignatura).forEach(([asignatura, data]) => {
            const promedio = (data.notas.reduce((sum, nota) => sum + nota, 0) / data.notas.length).toFixed(1);
            const notaMaxima = Math.max(...data.notas).toFixed(1);
            const notaMinima = Math.min(...data.notas).toFixed(1);
            
            const card = document.createElement('div');
            card.className = 'analysis-card';
            card.innerHTML = `
                <h4>📚 ${asignatura}</h4>
                <div class="analysis-stats">
                    <div class="analysis-stat">
                        <span class="stat-label">Promedio</span>
                        <span class="stat-value">${promedio}</span>
                    </div>
                    <div class="analysis-stat">
                        <span class="stat-label">Máxima</span>
                        <span class="stat-value">${notaMaxima}</span>
                    </div>
                    <div class="analysis-stat">
                        <span class="stat-label">Mínima</span>
                        <span class="stat-value">${notaMinima}</span>
                    </div>
                    <div class="analysis-stat">
                        <span class="stat-label">Estudiantes</span>
                        <span class="stat-value">${data.estudiantes.size}</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

function loadNotasPorCurso(notasProfesor) {
    const container = document.getElementById('notasPorCurso');
    container.innerHTML = '';
    
    // Agrupar notas por curso
    const notasPorCurso = {};
    
    notasProfesor.forEach(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        const curso = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'Sin curso';
        
        if (!notasPorCurso[curso]) {
            notasPorCurso[curso] = {
                notas: [],
                estudiantes: new Set()
            };
        }
        
        notasPorCurso[curso].notas.push(parseFloat(nota.valor || 0));
        if (nota.alumno_correo) {
            notasPorCurso[curso].estudiantes.add(nota.alumno_correo);
        }
    });
    
    // Crear tarjetas para cada curso con diseño mejorado
    Object.entries(notasPorCurso).forEach(([curso, data]) => {
        const promedio = data.notas.length > 0 ? 
            (data.notas.reduce((sum, nota) => sum + nota, 0) / data.notas.length).toFixed(1) : '0.0';
        
        // Determinar color según promedio
        let promedioClass = '';
        if (parseFloat(promedio) >= 6.0) promedioClass = 'excellent';
        else if (parseFloat(promedio) < 4.0) promedioClass = 'at-risk';
        
        const card = document.createElement('div');
        card.className = `course-card ${promedioClass}`;
        card.innerHTML = `
            <div class="course-header">
                <h4 class="course-name">🎓 ${curso}</h4>
                <span class="course-students">${data.estudiantes.size} estudiantes</span>
            </div>
            <div class="course-stats">
                <div class="course-stat">
                    <h3 class="course-stat-value">${promedio}</h3>
                    <p class="course-stat-label">📊 Promedio</p>
                </div>
                <div class="course-stat">
                    <h3 class="course-stat-value">${data.notas.length}</h3>
                    <p class="course-stat-label">📝 Notas</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (Object.keys(notasPorCurso).length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>📊 No hay notas registradas aún</div>';
    }
}

function loadActividadReciente(notasProfesor) {
    const container = document.getElementById('actividadReciente');
    container.innerHTML = '';
    
    // Obtener las últimas 5 notas del profesor
    const notasRecientes = [...notasProfesor]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
    
    if (notasRecientes.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>⏰ No hay actividad reciente</div>';
        return;
    }
    
    notasRecientes.forEach(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(nota.asignatura_id) || 
            String(a._id) === String(nota.asignatura_id)
        );
        
        const alumnoNombre = alumno ? `${alumno.nombre} ${alumno.apellido}` : nota.alumno_correo;
        const asignaturaNombre = nota.materia_nombre || (asignatura ? asignatura.nombre : 'Asignatura');
        
        // Determinar icono según la nota
        let iconClass = 'fas fa-star';
        let iconColor = '#667eea';
        if (parseFloat(nota.valor) >= 6.0) {
            iconClass = 'fas fa-trophy';
            iconColor = '#28a745';
        } else if (parseFloat(nota.valor) < 4.0) {
            iconClass = 'fas fa-exclamation-triangle';
            iconColor = '#dc3545';
        }
        
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon" style="background: ${iconColor};">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-content">
                <h4 class="activity-title">✨ Nota registrada: ${nota.valor}</h4>
                <p class="activity-description">👨‍🎓 ${alumnoNombre} - 📚 ${asignaturaNombre}</p>
            </div>
            <div class="activity-time">
                📅 ${formatDate(nota.fecha)}
            </div>
        `;
        container.appendChild(item);
    });
}

function loadAsistenciasPorCurso(asistenciasProfesor) {
    const container = document.getElementById('asistenciasPorCurso');
    container.innerHTML = '';
    
    // Filtrar solo asistencias de las materias del profesor
    const asistenciasFiltradas = asistenciasProfesor.filter(a => {
        return asignaturas.some(asig => asig.nombre === a.materia_nombre);
    });
    
    // Agrupar asistencias por curso
    const asistenciasPorCurso = {};
    
    asistenciasFiltradas.forEach(asistencia => {
        const alumno = usuarios.find(u => u.correo === asistencia.alumno_correo);
        const curso = alumno ? (alumno.curso || alumno.curso_nombre || 'Sin curso') : 'Sin curso';
        
        if (!asistenciasPorCurso[curso]) {
            asistenciasPorCurso[curso] = {
                total: 0,
                presentes: 0,
                ausentes: 0,
                justificados: 0,
                estudiantes: new Set()
            };
        }
        
        asistenciasPorCurso[curso].total++;
        if (asistencia.estado === 'Presente') asistenciasPorCurso[curso].presentes++;
        else if (asistencia.estado === 'Ausente') asistenciasPorCurso[curso].ausentes++;
        else if (asistencia.estado === 'Justificado') asistenciasPorCurso[curso].justificados++;
        
        if (asistencia.alumno_correo) {
            asistenciasPorCurso[curso].estudiantes.add(asistencia.alumno_correo);
        }
    });
    
    // Crear tarjetas para cada curso
    Object.entries(asistenciasPorCurso).forEach(([curso, data]) => {
        const porcentaje = data.total > 0 ? Math.round((data.presentes / data.total) * 100) : 0;
        
        let porcentajeClass = '';
        if (porcentaje >= 90) porcentajeClass = 'excellent';
        else if (porcentaje < 70) porcentajeClass = 'at-risk';
        
        const card = document.createElement('div');
        card.className = `course-card ${porcentajeClass}`;
        card.innerHTML = `
            <div class="course-header">
                <h4 class="course-name">🎓 ${curso}</h4>
                <span class="course-students">${data.estudiantes.size} estudiantes</span>
            </div>
            <div class="course-stats">
                <div class="course-stat">
                    <h3 class="course-stat-value">${porcentaje}%</h3>
                    <p class="course-stat-label">📊 % Asistencia</p>
                </div>
                <div class="course-stat">
                    <h3 class="course-stat-value">${data.total}</h3>
                    <p class="course-stat-label">📅 Registros</p>
                </div>
            </div>
            <div class="attendance-breakdown">
                <div class="breakdown-item">
                    <span class="breakdown-label">✅ Presentes:</span>
                    <span class="breakdown-value">${data.presentes}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">❌ Ausentes:</span>
                    <span class="breakdown-value">${data.ausentes}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">📝 Justificados:</span>
                    <span class="breakdown-value">${data.justificados}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (Object.keys(asistenciasPorCurso).length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>📅 No hay asistencias registradas aún</div>';
    }
}

function loadAsistenciasPorCursoFiltrado(asistenciasCurso, cursoSeleccionado) {
    const container = document.getElementById('asistenciasPorCurso');
    container.innerHTML = '';
    
    // Filtrar solo asistencias de las materias del profesor
    const asistenciasFiltradas = asistenciasCurso.filter(a => {
        return asignaturas.some(asig => asig.nombre === a.materia_nombre);
    });
    
    // Agrupar asistencias por asignatura en el curso
    const asistenciasPorAsignatura = {};
    
    asistenciasFiltradas.forEach(asistencia => {
        const nombreAsignatura = asistencia.materia_nombre || 'Asignatura';
        
        if (!asistenciasPorAsignatura[nombreAsignatura]) {
            asistenciasPorAsignatura[nombreAsignatura] = {
                total: 0,
                presentes: 0,
                ausentes: 0,
                justificados: 0,
                estudiantes: new Set()
            };
        }
        
        asistenciasPorAsignatura[nombreAsignatura].total++;
        if (asistencia.estado === 'Presente') asistenciasPorAsignatura[nombreAsignatura].presentes++;
        else if (asistencia.estado === 'Ausente') asistenciasPorAsignatura[nombreAsignatura].ausentes++;
        else if (asistencia.estado === 'Justificado') asistenciasPorAsignatura[nombreAsignatura].justificados++;
        
        if (asistencia.alumno_correo) {
            asistenciasPorAsignatura[nombreAsignatura].estudiantes.add(asistencia.alumno_correo);
        }
    });
    
    // Crear tarjetas para cada asignatura
    Object.entries(asistenciasPorAsignatura).forEach(([asignatura, data]) => {
        const porcentaje = data.total > 0 ? Math.round((data.presentes / data.total) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-header">
                <h4 class="course-name">📚 ${asignatura}</h4>
                <span class="course-students">${data.estudiantes.size} estudiantes</span>
            </div>
            <div class="course-stats">
                <div class="course-stat">
                    <h3 class="course-stat-value">${porcentaje}%</h3>
                    <p class="course-stat-label">% Asistencia</p>
                </div>
                <div class="course-stat">
                    <h3 class="course-stat-value">${data.total}</h3>
                    <p class="course-stat-label">Registros</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    if (Object.keys(asistenciasPorAsignatura).length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-calendar-check" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>No hay asistencias registradas en ${cursoSeleccionado}</div>`;
    }
}

function loadMateriasForAsistenciaFilter() {
    const materiaSelect = document.getElementById('materiaAsistenciaFilter');
    if (materiaSelect) {
        materiaSelect.innerHTML = '<option value="">Todas mis materias</option>';
        
        // Usar solo las materias del profesor
        asignaturas.forEach(asignatura => {
            const option = document.createElement('option');
            option.value = asignatura.nombre;
            option.textContent = asignatura.nombre;
            materiaSelect.appendChild(option);
        });
        
        // Event listener para filtro
        materiaSelect.removeEventListener('change', renderAsistencias);
        materiaSelect.addEventListener('change', renderAsistencias);
    }
}

async function editAsistencia(id) {
    const asistencia = asistencias.find(a => (a.id === id || a._id === id));
    if (!asistencia) {
        console.error('Asistencia no encontrada:', id);
        showAlert('Asistencia no encontrada', 'error');
        return;
    }

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
        await updateAsistencia();
    });
}

function closeEditAsistenciaModal() {
    const modal = document.getElementById('editAsistenciaModal');
    if (modal) {
        modal.remove();
    }
}

async function updateAsistencia() {
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
        
        const response = await fetch(`${API_BASE_URL}/asistencias/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        
        showAlert('Asistencia actualizada correctamente', 'success');
        closeEditAsistenciaModal();
        await loadAsistencias();
    } catch (error) {
        console.error('Error al actualizar asistencia:', error);
        showAlert('Error al actualizar asistencia: ' + error.message, 'error');
    }
}

// Eliminar una asistencia (función usada por el botón en la vista de profesor)
async function deleteAsistenciaRecord(id) {
    if (!id) return showAlert('Id de asistencia inválido', 'error');
    const ok = confirm('¿Confirmas eliminar esta asistencia? Esta acción no se puede deshacer.');
    if (!ok) return;

    try {
        const res = await fetch(`${API_BASE_URL}/asistencias/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            let parsed = body;
            try { parsed = JSON.parse(body); } catch (e) { /* keep text */ }
            throw new Error(parsed && parsed.message ? parsed.message : `HTTP error ${res.status}`);
        }

        // Intentar parsear JSON de respuesta
        const result = await res.json().catch(() => ({}));
        showAlert('Asistencia eliminada correctamente', 'success');
        await loadAsistencias();
    } catch (err) {
        console.error('Error al eliminar asistencia:', err);
        showAlert('Error al eliminar asistencia: ' + (err.message || err), 'error');
    }
}

function showAlert(message, type) {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const main = document.querySelector('.main');
    main.insertBefore(alert, main.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}