// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserInfo();
});

function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '../views/index.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    const currentPage = window.location.pathname.split('/').pop();
    
    // Verificar que el usuario esté en la página correcta según su rol
    const rolePages = {
        1: 'administrador.html',
        2: 'profesor.html', 
        3: 'alumno.html',
        4: 'tutor.html'
    };
    
    if (rolePages[user.id_rol] !== currentPage) {
        window.location.href = rolePages[user.id_rol];
    }
}

function loadUserInfo() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `${user.nombre} ${user.apellido}`;
        }
    }
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        window.location.href = '../views/index.html';
    }
}

function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}