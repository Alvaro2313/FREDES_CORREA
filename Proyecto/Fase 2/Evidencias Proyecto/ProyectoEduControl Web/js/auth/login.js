const API_BASE_URL = 'https://edcontrol-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si ya hay una sesión activa
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        redirectToUserDashboard(user.id_rol);
        return;
    }

    // Configurar formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Configurar recuperar contraseña (opcional)
    const recoverBtn = document.getElementById('recoverBtn');
    if (recoverBtn) {
        recoverBtn.addEventListener('click', openRecoverModal);
    }
    
    const closeRecoverModal = document.getElementById('closeRecoverModal');
    if (closeRecoverModal) {
        closeRecoverModal.addEventListener('click', closeRecoverModal);
    }
    
    const cancelRecoverBtn = document.getElementById('cancelRecoverBtn');
    if (cancelRecoverBtn) {
        cancelRecoverBtn.addEventListener('click', closeRecoverModal);
    }
    
    const recoverForm = document.getElementById('recoverForm');
    if (recoverForm) {
        recoverForm.addEventListener('submit', handleRecover);
    }
    
    // Cerrar modal al hacer clic fuera
    const recoverModal = document.getElementById('recoverModal');
    if (recoverModal) {
        recoverModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeRecoverModal();
            }
        });
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const correo = document.getElementById('correo').value;
    const contrasena = document.getElementById('contrasena').value;
    const loginBtn = document.querySelector('.login-btn');
    const errorDiv = document.getElementById('loginError');
    
    // Mostrar loading
    loginBtn.innerHTML = '<div class="loading"></div> Iniciando sesión...';
    loginBtn.disabled = true;
    errorDiv.style.display = 'none';
    
    try {
        // Obtener todos los usuarios
        const usuarios = await fetch(`${API_BASE_URL}/usuarios`).then(res => res.json());
        
        // Buscar usuario por correo y contraseña
        const user = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);
        
        if (user) {
            // Verificar si el usuario está activo
            if (user.activo === false) {
                throw new Error('Cuenta deshabilitada. Contacte al administrador.');
            }
            
            // Guardar usuario en localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('userId', user._id || user.id);
            localStorage.setItem('userRole', user.id_rol);
            localStorage.setItem('userEmail', user.correo);
            
            // Redirigir según el rol
            redirectToUserDashboard(user.id_rol);
        } else {
            throw new Error('Credenciales incorrectas');
        }
        
    } catch (error) {
        console.error('Error de login:', error);
        if (error.message.includes('deshabilitada')) {
            errorDiv.textContent = error.message;
        } else {
            errorDiv.textContent = 'Correo o contraseña incorrectos';
        }
        errorDiv.style.display = 'block';
    } finally {
        // Restaurar botón
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
        loginBtn.disabled = false;
    }
}

function redirectToUserDashboard(roleId) {
    console.log('Redirigiendo usuario con rol:', roleId);
    
    switch(roleId) {
        case 1: // Administrador
            console.log('Redirigiendo a administrador.html');
            window.location.href = '../views/administrador.html';
            break;
        case 2: // Profesor
            console.log('Redirigiendo a profesor.html');
            window.location.href = '../views/profesor.html';
            break;
        case 3: // Alumno
            console.log('Redirigiendo a alumno.html');
            window.location.href = '../views/alumno.html';
            break;
        case 4: // Tutor
            console.log('Redirigiendo a tutor.html');
            window.location.href = '../views/tutor.html';
            break;
        default:
            console.error('Rol no reconocido:', roleId);
    }
}

function openRecoverModal() {
    document.getElementById('recoverModal').style.display = 'block';
    document.getElementById('recoverForm').reset();
    document.getElementById('recoverError').style.display = 'none';
}

function closeRecoverModal() {
    document.getElementById('recoverModal').style.display = 'none';
}

async function handleRecover(e) {
    e.preventDefault();
    
    const rut = document.getElementById('recoverRut').value;
    const errorDiv = document.getElementById('recoverError');
    
    try {
        // Obtener todos los usuarios
        const usuarios = await fetch(`${API_BASE_URL}/usuarios`).then(res => res.json());
        
        // Buscar usuario por RUT
        const user = usuarios.find(u => u.rut === rut);
        
        if (!user) {
            errorDiv.textContent = 'RUT no encontrado';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Mostrar la contraseña actual
        alert(`Contraseña encontrada:\n\nUsuario: ${user.nombre} ${user.apellido}\nCorreo: ${user.correo}\nContraseña: ${user.contrasena}`);
        closeRecoverModal();
        
    } catch (error) {
        console.error('Error al recuperar contraseña:', error);
        errorDiv.textContent = 'Error al buscar el usuario';
        errorDiv.style.display = 'block';
    }
}