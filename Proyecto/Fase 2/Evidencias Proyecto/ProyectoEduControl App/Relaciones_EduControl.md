# 🔗 TODAS LAS RELACIONES - SISTEMA EDUCONTROL

## 1️⃣ **USUARIOS ↔ USUARIOS** (Tutor-Alumno)
```
TIPO: 1:N (Un tutor → Muchos alumnos)
CLAVE: usuarios.tutor_id → usuarios._id
CONDICIÓN: tutor.id_rol = 4 AND alumno.id_rol = 3
EJEMPLO: José Caro (tutor) → Ana Soto, Tomás Leiva (alumnos)
```

## 2️⃣ **USUARIOS ↔ CURSOS** (Alumno-Curso)
```
TIPO: N:1 (Muchos alumnos → Un curso)
CLAVE: usuarios.curso_id → cursos._id
CONDICIÓN: usuario.id_rol = 3
EJEMPLO: Ana, Tomás, Daniela → 1° Medio A
```

## 3️⃣ **CURSOS ↔ ASIGNATURAS**
```
TIPO: 1:N (Un curso → Muchas asignaturas)
CLAVE: asignaturas.curso_id → cursos._id
EJEMPLO: 1° Medio A → Matemáticas, Lenguaje, Historia, Ciencias
```

## 4️⃣ **USUARIOS ↔ ASIGNATURAS** (Profesor-Asignatura)
```
TIPO: 1:N (Un profesor → Muchas asignaturas)
CLAVE: asignaturas.profesor_nombre → usuarios.nombre+apellido
CONDICIÓN: usuario.id_rol = 2
EJEMPLO: Laura González → Matemáticas, Álgebra
```

## 5️⃣ **USUARIOS ↔ NOTAS** (Alumno-Nota)
```
TIPO: 1:N (Un alumno → Muchas notas)
CLAVE: notas.alumno_correo → usuarios.correo
CONDICIÓN: usuario.id_rol = 3
EJEMPLO: ana.soto@educontrol.cl → Nota 6.5, Nota 5.8, Nota 7.0
```

## 6️⃣ **ASIGNATURAS ↔ NOTAS**
```
TIPO: 1:N (Una asignatura → Muchas notas)
CLAVE: notas.asignatura_id → asignaturas._id
EJEMPLO: Matemáticas (ID:1) → Nota Ana 6.5, Nota Tomás 4.9
```

## 7️⃣ **USUARIOS ↔ ASISTENCIAS** (Alumno-Asistencia)
```
TIPO: 1:N (Un alumno → Muchas asistencias)
CLAVE: asistencias.alumno_correo → usuarios.correo
CONDICIÓN: usuario.id_rol = 3
EJEMPLO: tomas.leiva@educontrol.cl → Presente, Ausente, Justificado
```

## 8️⃣ **ASIGNATURAS ↔ ASISTENCIAS**
```
TIPO: 1:N (Una asignatura → Muchas asistencias)
CLAVE: asistencias.asignatura_id → asignaturas._id
EJEMPLO: Historia (ID:3) → Asistencia Ana, Asistencia Daniela
```

## 9️⃣ **ASIGNATURAS ↔ HORARIOS**
```
TIPO: 1:N (Una asignatura → Muchos horarios)
CLAVE: horarios.asignatura_id → asignaturas._id
EJEMPLO: Matemáticas → Lunes 8:00-9:30, Miércoles 10:00-11:30
```

## 🔟 **CURSOS ↔ HORARIOS**
```
TIPO: 1:N (Un curso → Muchos horarios)
CLAVE: horarios.curso_id → cursos._id
EJEMPLO: 1° Medio A → Horario Matemáticas, Horario Lenguaje
```

## 1️⃣1️⃣ **USUARIOS ↔ NOTAS** (Profesor-Nota)
```
TIPO: 1:N (Un profesor → Muchas notas que asigna)
CLAVE: notas.profesor_id → usuarios._id
CONDICIÓN: usuario.id_rol = 2
EJEMPLO: Laura González → Todas las notas de Matemáticas
```

---

## 📊 MATRIZ DE RELACIONES

| ENTIDAD 1 | RELACIÓN | ENTIDAD 2 | CARDINALIDAD | CLAVE FORÁNEA |
|-----------|----------|-----------|--------------|---------------|
| Tutor | tiene | Alumnos | 1:N | usuarios.tutor_id |
| Curso | contiene | Alumnos | 1:N | usuarios.curso_id |
| Curso | tiene | Asignaturas | 1:N | asignaturas.curso_id |
| Profesor | enseña | Asignaturas | 1:N | asignaturas.profesor_nombre |
| Alumno | tiene | Notas | 1:N | notas.alumno_correo |
| Asignatura | genera | Notas | 1:N | notas.asignatura_id |
| Alumno | registra | Asistencias | 1:N | asistencias.alumno_correo |
| Asignatura | controla | Asistencias | 1:N | asistencias.asignatura_id |
| Asignatura | programa | Horarios | 1:N | horarios.asignatura_id |
| Curso | organiza | Horarios | 1:N | horarios.curso_id |
| Profesor | califica | Notas | 1:N | notas.profesor_id |

---

## 🎯 RELACIONES ESPECIALES

### **HERENCIA POR ROLES**
```
USUARIOS (Entidad base)
├── id_rol = 1 → ADMINISTRADOR
├── id_rol = 2 → PROFESOR (+ especialidad)
├── id_rol = 3 → ALUMNO (+ curso_id, tutor_id, fecha_nacimiento)
└── id_rol = 4 → TUTOR (+ teléfono)
```

### **RELACIONES TRANSITIVAS**
```
TUTOR → ALUMNO → CURSO → ASIGNATURAS → NOTAS
TUTOR → ALUMNO → ASISTENCIAS → ASIGNATURA → PROFESOR
CURSO → ASIGNATURAS → HORARIOS
```

### **RELACIONES MÚLTIPLES**
```
ALUMNO está relacionado con:
├── 1 TUTOR (opcional)
├── 1 CURSO (obligatorio)
├── N NOTAS (por asignatura)
├── N ASISTENCIAS (por asignatura/fecha)
└── N HORARIOS (a través del curso)
```

---

## 🔍 CONSULTAS TÍPICAS

### **Obtener todas las notas de un alumno:**
```javascript
// Relación: ALUMNO → NOTAS → ASIGNATURAS
notas.find({alumno_correo: "ana.soto@educontrol.cl"})
```

### **Obtener alumnos de un tutor:**
```javascript
// Relación: TUTOR → ALUMNOS
usuarios.find({tutor_id: tutor_id, id_rol: 3})
```

### **Obtener horario de un curso:**
```javascript
// Relación: CURSO → ASIGNATURAS → HORARIOS
horarios.find({curso_id: curso_id})
```

### **Obtener asignaturas de un profesor:**
```javascript
// Relación: PROFESOR → ASIGNATURAS
asignaturas.find({profesor_nombre: "Laura González"})
```