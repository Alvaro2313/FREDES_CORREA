# EduControl - Sistema de Gestión Educativa

## 📋 Descripción
EduControl es un sistema web completo para la gestión educativa que permite administrar usuarios, cursos, asignaturas, notas y asistencias con diferentes roles de usuario.

## 🏗️ Estructura del Proyecto

```
ProyectoEdu/
├── 📁 views/                    # Interfaces de usuario
│   ├── 🏠 index.html           # Página de login
│   ├── 👨‍💼 administrador.html    # Panel administrativo
│   ├── 👨‍🏫 profesor.html        # Panel del profesor
│   ├── 👨‍👩‍👧‍👦 tutor.html           # Panel del tutor
│   └── 👨‍🎓 alumno.html          # Panel del estudiante
├── 📁 js/                       # Lógica JavaScript
│   ├── 📁 auth/                 # Autenticación
│   │   ├── 🔐 login.js          # Manejo de login
│   │   └── 🛡️ auth.js           # Verificación de sesión
│   ├── 📁 views/                # Controladores de vistas
│   │   ├── administrador.js     # Lógica del admin
│   │   ├── profesor.js          # Lógica del profesor
│   │   ├── tutor.js             # Lógica del tutor
│   │   └── alumno.js            # Lógica del alumno
│   └── 📁 utils/                # Utilidades (futuro)
├── 📁 css/                      # Estilos
│   └── 🎨 styles.css            # Estilos principales
├── 📁 backend/                  # Servidor y API
│   ├── 🖥️ server.js             # Servidor principal
│   ├── 📧 email-endpoint.js     # Servicio de emails
│   └── 📦 package.json          # Dependencias
├── 📁 docs/                     # Documentación
│   └── 📖 INSTRUCCIONES_EJECUCION.txt
└── 📄 README.md                 # Este archivo
```

## 🚀 Inicio Rápido

1. **Clonar o descargar el proyecto**
2. **Abrir terminal en la carpeta del proyecto**
3. **Ejecutar servidor local:**
   ```bash
   python -m http.server 8000
   ```
4. **Abrir navegador en:** http://localhost:8000/views/index.html

## 👥 Roles y Funcionalidades

### 👨‍💼 Administrador
- ✅ Gestión completa de usuarios
- ✅ Administración de cursos y asignaturas
- ✅ Asignación de profesores y tutores
- ✅ Gestión de horarios
- ✅ Reportes y estadísticas

### 👨‍🏫 Profesor
- ✅ Gestión de sus asignaturas
- ✅ Registro y edición de notas
- ✅ Control de asistencias
- ✅ Filtros por estudiante

### 👨‍👩‍👧‍👦 Tutor
- ✅ Supervisión de alumnos asignados
- ✅ Consulta de notas y asistencias
- ✅ Seguimiento académico

### 👨‍🎓 Alumno
- ✅ Consulta de notas personales
- ✅ Revisión de asistencias
- ✅ Visualización de horarios

## 🔑 Credenciales de Prueba

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@educontrol.cl | admin123 |
| Profesor | profesor@educontrol.cl | prof123 |
| Tutor | tutor@educontrol.cl | tutor123 |
| Alumno | alumno@educontrol.cl | alumno123 |

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Diseño responsivo
- **JavaScript ES6+** - Lógica de aplicación
- **Font Awesome** - Iconografía
- **Fetch API** - Comunicación con backend

### Backend
- **Node.js** - Servidor
- **Express** - Framework web
- **MongoDB** - Base de datos
- **Nodemailer** - Envío de emails

## 📧 Características Especiales

- **📨 Notificaciones Automáticas:** Emails al crear notas
- **🔒 Gestión de Estados:** Habilitar/deshabilitar usuarios
- **🔍 Filtros Avanzados:** En todas las vistas
- **✅ Validaciones:** Frontend y backend
- **📱 Responsive:** Compatible con móviles

## 📖 Documentación Completa

Para instrucciones detalladas de instalación y configuración, consultar:
`docs/INSTRUCCIONES_EJECUCION.txt`

## 🐛 Solución de Problemas

### Error CORS
```bash
# Usar servidor local en lugar de abrir archivo directamente
python -m http.server 8000
```

### Datos no cargan
1. Verificar conexión a internet
2. Revisar consola del navegador (F12)
3. Confirmar disponibilidad del backend

## 🌐 API Backend

**URL Base:** `https://edcontrol-backend.onrender.com/api`

### Endpoints Principales
- `GET /usuarios` - Obtener usuarios
- `GET /asignaturas` - Obtener asignaturas
- `GET /notas` - Obtener notas
- `POST /web/notas` - Crear nota (con email)
- `GET /asistencias` - Obtener asistencias

## 📝 Notas de Desarrollo

- **Seguridad:** Proyecto de desarrollo, implementar seguridad adicional en producción
- **Base de Datos:** Compartida en la nube, cambios son persistentes
- **Emails:** Se envían a direcciones reales configuradas
- **Compatibilidad:** Probado en Chrome, Firefox, Edge

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es de uso educativo y de desarrollo.