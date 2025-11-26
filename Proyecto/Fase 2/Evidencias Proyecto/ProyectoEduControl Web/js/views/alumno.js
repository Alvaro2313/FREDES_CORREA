const API_BASE_URL = 'https://edcontrol-backend.onrender.com/api';

let currentSection = 'notas';
let notas = [];
let asistencias = [];
let asignaturas = [];

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
    
    if (section === 'horario') {
        loadHorario();
    }
}

async function loadData() {
    try {
        asignaturas = await fetch(`${API_BASE_URL}/asignaturas`).then(res => res.json());
        await loadNotas();
        await loadAsistencias();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadNotas() {
    try {
        const currentUser = getCurrentUser();
        console.log('Current user:', currentUser);
        
        // Usar el nuevo endpoint específico del alumno
        const alumnoId = currentUser._id || currentUser.id;
        notas = await fetch(`${API_BASE_URL}/web/notas/alumno/${alumnoId}`).then(res => res.json());
        console.log('Notas del alumno:', notas);
        
        renderNotas();
    } catch (error) {
        console.error('Error loading notas:', error);
        // Fallback al método anterior si el nuevo endpoint falla
        try {
            const allNotas = await fetch(`${API_BASE_URL}/notas`).then(res => res.json());
            notas = allNotas.filter(n => String(n.id_alumno) === String(currentUser._id || currentUser.id));
            renderNotas();
        } catch (fallbackError) {
            console.error('Error en fallback:', fallbackError);
        }
    }
}

async function loadAsistencias() {
    try {
        const currentUser = getCurrentUser();
        const allAsistencias = await fetch(`${API_BASE_URL}/asistencias`).then(res => res.json());
        
        // Filtrar solo las asistencias del alumno actual
        asistencias = allAsistencias.filter(a => a.id_alumno === currentUser.id);
        renderAsistencias();
    } catch (error) {
        console.error('Error loading asistencias:', error);
    }
}

function renderNotas() {
    const tbody = document.querySelector('#notasTable tbody');
    tbody.innerHTML = '';

    console.log('Rendering notas:', notas);
    console.log('Available asignaturas:', asignaturas);

    if (!notas || notas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3">No hay notas disponibles</td>';
        tbody.appendChild(row);
        return;
    }

    notas.forEach(nota => {
        const asignatura = asignaturas.find(a => a.id === nota.id_asignatura);
        console.log('Processing nota:', nota, 'Found asignatura:', asignatura);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asignatura ? asignatura.nombre : 'Asignatura ID: ' + nota.id_asignatura}</td>
            <td>${nota.valor || 'N/A'}</td>
            <td>${formatDate(nota.fecha)}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderAsistencias() {
    const tbody = document.querySelector('#asistenciasTable tbody');
    tbody.innerHTML = '';

    asistencias.forEach(asistencia => {
        const asignatura = asignaturas.find(a => a.id === asistencia.id_asignatura);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asignatura ? asignatura.nombre : 'N/A'}</td>
            <td>${formatDate(asistencia.fecha)}</td>
            <td><span class="status-${asistencia.estado.toLowerCase()}">${asistencia.estado}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

async function loadHorario() {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.curso) {
        console.log('No se encontró curso del usuario');
        return;
    }
    
    try {
        // Usar el nuevo endpoint de horarios por nombre de curso
        const horario = await fetch(`${API_BASE_URL}/horarios/${encodeURIComponent(currentUser.curso)}`).then(res => res.json());
        
        if (horario && horario.horario) {
            // Llenar la tabla con el horario desde la API
            Object.entries(horario.horario).forEach(([dia, horas]) => {
                Object.entries(horas).forEach(([hora, materiaInfo]) => {
                    const [horaInicio] = hora.split('-');
                    const bloqueNumero = getBloque(horaInicio);
                    const elementId = `${dia}-${bloqueNumero}`;
                    const element = document.getElementById(elementId);
                    
                    if (element && materiaInfo) {
                        const asignatura = asignaturas.find(a => 
                            (a._id === materiaInfo) || (a.id === materiaInfo) ||
                            (typeof materiaInfo === 'object' && (a._id === materiaInfo.id || a.nombre === materiaInfo.nombre))
                        );
                        
                        const nombreMateria = asignatura ? asignatura.nombre : 
                            (typeof materiaInfo === 'object' ? materiaInfo.nombre : materiaInfo);
                        
                        element.textContent = nombreMateria;
                        element.style.background = '#e3f2fd';
                        element.style.fontWeight = '600';
                        element.style.color = '#1976d2';
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error cargando horario desde API:', error);
        // Fallback al horario predefinido si falla la API
        loadHorarioFallback();
    }
}

function getBloque(hora) {
    const bloques = {
        '08:00': '1', '08:45': '2', '09:30': '3',
        '10:30': '4', '11:15': '5', '12:00': '6',
        '14:00': '7', '14:45': '8', '15:30': '9'
    };
    return bloques[hora] || '1';
}

function loadHorarioFallback() {
    const currentUser = getCurrentUser();
    const asignaturasDelCurso = asignaturas.filter(a => a.curso === currentUser.curso);
    
    const horarioBase = {
        'lunes-1': 'Matemáticas', 'lunes-2': 'Lenguaje', 'lunes-3': 'Historia',
        'martes-1': 'Ciencias', 'martes-2': 'Inglés', 'martes-3': 'Arte',
        'miercoles-1': 'Educación Física', 'miercoles-2': 'Música', 'miercoles-3': 'Tecnología'
    };
    
    Object.keys(horarioBase).forEach(slot => {
        const element = document.getElementById(slot);
        if (element) {
            element.textContent = horarioBase[slot];
            element.style.background = '#f8f9fa';
            element.style.color = '#6c757d';
        }
    });
}