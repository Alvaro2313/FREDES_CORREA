const API_BASE_URL = 'https://edcontrol-backend.onrender.com/api';

let currentSection = 'alumnos';
let misAlumnos = [];
let notas = [];
let asistencias = [];
let asignaturas = [];
let usuarios = [];

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    loadData();
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
        asignaturas = await fetch(`${API_BASE_URL}/asignaturas`).then(res => res.json());
        
        console.log('Usuarios cargados:', usuarios.length);
        console.log('localStorage userId:', localStorage.getItem('userId'));
        
        await loadMisAlumnos();
        await loadNotas();
        await loadAsistencias();
        loadAlumnosForFilters();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadMisAlumnos() {
    try {
        console.log('=== CARGANDO ALUMNOS DEL TUTOR ===');
        console.log('Total usuarios cargados:', usuarios.length);
        
        const currentUser = getCurrentUser();
        const tutorId = currentUser.id || currentUser._id;
        
        console.log('Tutor actual:', currentUser);
        console.log('Tutor ID:', tutorId);
        
        if (!tutorId) {
            console.error('No se pudo obtener el ID del tutor');
            misAlumnos = [];
            renderMisAlumnos();
            return;
        }
        
        // Mostrar todos los alumnos para debug
        const todosLosAlumnos = usuarios.filter(u => u.id_rol === 3);
        console.log('Todos los alumnos en el sistema:', todosLosAlumnos.length);
        todosLosAlumnos.forEach(alumno => {
            console.log(`Alumno: ${alumno.nombre} ${alumno.apellido}`);
            console.log(`  - tutor_id: ${alumno.tutor_id}`);
            console.log(`  - id_tutor: ${alumno.id_tutor}`);
            console.log(`  - tutor_nombre: ${alumno.tutor_nombre}`);
        });
        
        // Filtrar solo alumnos asignados a este tutor
        misAlumnos = usuarios.filter(u => {
            const isStudent = u.id_rol === 3;
            const isAssignedToMe = u.tutor_id === tutorId || 
                                  u.id_tutor === tutorId || 
                                  String(u.tutor_id) === String(tutorId) ||
                                  String(u.id_tutor) === String(tutorId);
            
            if (isStudent) {
                console.log(`Alumno ${u.nombre}: tutor_id=${u.tutor_id}, id_tutor=${u.id_tutor}, tutorId=${tutorId}, isAssignedToMe=${isAssignedToMe}`);
            }
            
            return isStudent && isAssignedToMe;
        });
        
        console.log('Alumnos asignados encontrados:', misAlumnos.length);
        console.log('Alumnos asignados:', misAlumnos.map(a => a.nombre));
        
        renderMisAlumnos();
    } catch (error) {
        console.error('Error loading mis alumnos:', error);
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

function loadAlumnosForFilters() {
    // Filtro para notas
    const selectNotas = document.getElementById('alumnoFilter');
    selectNotas.innerHTML = '<option value="">Todos los alumnos</option>';
    
    misAlumnos.forEach(alumno => {
        const option = document.createElement('option');
        option.value = alumno._id || alumno.id;
        option.textContent = `${alumno.nombre} ${alumno.apellido}`;
        selectNotas.appendChild(option);
    });

    selectNotas.addEventListener('change', (e) => {
        renderNotas(e.target.value);
    });

    // Filtro para asistencias
    const selectAsistencias = document.getElementById('alumnoFilterAsistencia');
    selectAsistencias.innerHTML = '<option value="">Todos los alumnos</option>';
    
    misAlumnos.forEach(alumno => {
        const option = document.createElement('option');
        option.value = alumno._id || alumno.id;
        option.textContent = `${alumno.nombre} ${alumno.apellido}`;
        selectAsistencias.appendChild(option);
    });

    selectAsistencias.addEventListener('change', (e) => {
        renderAsistencias(e.target.value);
    });
}

function renderMisAlumnos() {
    const tbody = document.querySelector('#alumnosTable tbody');
    tbody.innerHTML = '';

    if (misAlumnos.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; color: #666;">No tienes alumnos asignados</td>';
        tbody.appendChild(row);
        return;
    }

    misAlumnos.forEach(alumno => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumno.nombre}</td>
            <td>${alumno.apellido || ''}</td>
            <td>${alumno.rut || 'N/A'}</td>
            <td>${alumno.correo}</td>
            <td>${alumno.curso || alumno.curso_nombre || 'Sin curso'}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderNotas(filtroAlumno = '') {
    const tbody = document.querySelector('#notasTable tbody');
    tbody.innerHTML = '';

    // Solo mostrar notas de mis alumnos asignados
    const idsAlumnos = misAlumnos.map(a => a.id || a._id);
    let notasFiltradas = notas.filter(n => {
        // Usar alumno_correo para buscar notas
        const alumnoCorreo = n.alumno_correo;
        return misAlumnos.some(alumno => alumno.correo === alumnoCorreo);
    });
    
    if (filtroAlumno) {
        const alumnoSeleccionado = misAlumnos.find(a => (a.id || a._id) == filtroAlumno);
        if (alumnoSeleccionado) {
            notasFiltradas = notasFiltradas.filter(n => n.alumno_correo === alumnoSeleccionado.correo);
        }
    }

    if (notasFiltradas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay notas disponibles</td>';
        tbody.appendChild(row);
        return;
    }

    notasFiltradas.forEach(nota => {
        const alumno = usuarios.find(u => u.correo === nota.alumno_correo);
        
        // Usar materia_nombre si está disponible, sino buscar en asignaturas
        let nombreAsignatura;
        if (nota.materia_nombre) {
            nombreAsignatura = nota.materia_nombre;
        } else {
            const asignatura = asignaturas.find(a => 
                String(a.id) === String(nota.asignatura_id) || 
                String(a._id) === String(nota.asignatura_id)
            );
            nombreAsignatura = asignatura ? asignatura.nombre : `ID: ${nota.asignatura_id}`;
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumno ? `${alumno.nombre} ${alumno.apellido}` : nota.alumno_correo}</td>
            <td>${nombreAsignatura}</td>
            <td>${nota.valor}</td>
            <td>${formatDate(nota.fecha)}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderAsistencias(filtroAlumno = '') {
    const tbody = document.querySelector('#asistenciasTable tbody');
    tbody.innerHTML = '';

    // Solo mostrar asistencias de mis alumnos asignados
    let asistenciasFiltradas = asistencias.filter(a => {
        // Usar alumno_correo para buscar asistencias
        const alumnoCorreo = a.alumno_correo;
        return misAlumnos.some(alumno => alumno.correo === alumnoCorreo);
    });
    
    if (filtroAlumno) {
        const alumnoSeleccionado = misAlumnos.find(a => (a.id || a._id) == filtroAlumno);
        if (alumnoSeleccionado) {
            asistenciasFiltradas = asistenciasFiltradas.filter(a => a.alumno_correo === alumnoSeleccionado.correo);
        }
    }

    if (asistenciasFiltradas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay asistencias disponibles</td>';
        tbody.appendChild(row);
        return;
    }

    asistenciasFiltradas.forEach(asistencia => {
        const alumno = usuarios.find(u => u.correo === asistencia.alumno_correo);
        const asignatura = asignaturas.find(a => 
            String(a.id) === String(asistencia.asignatura_id) || 
            String(a._id) === String(asistencia.asignatura_id)
        );
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${alumno ? `${alumno.nombre} ${alumno.apellido}` : asistencia.alumno_correo}</td>
            <td>${asignatura ? asignatura.nombre : `ID: ${asistencia.asignatura_id}`}</td>
            <td>${formatDate(asistencia.fecha)}</td>
            <td><span class="status-${asistencia.estado.toLowerCase()}">${asistencia.estado}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function getCurrentUser() {
    // Obtener usuario actual del localStorage o sesión
    const userId = localStorage.getItem('userId');
    console.log('UserId from localStorage:', userId);
    console.log('Usuarios disponibles:', usuarios.map(u => ({id: u.id, _id: u._id, nombre: u.nombre, rol: u.id_rol})));
    
    // Buscar por diferentes campos de ID
    let user = usuarios.find(u => String(u.id) === String(userId)) ||
               usuarios.find(u => String(u._id) === String(userId)) ||
               usuarios.find(u => u.correo === localStorage.getItem('userEmail'));
    
    console.log('Current user found:', user);
    
    // Si no encuentra el usuario, usar el primer tutor como fallback para testing
    if (!user) {
        user = usuarios.find(u => u.id_rol === 4);
        console.log('Fallback tutor user:', user);
    }
    
    return user || {};
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}