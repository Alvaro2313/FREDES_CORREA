# 📊 MODELO ENTIDAD-RELACIÓN - SISTEMA EDUCONTROL

## 🏗️ ESTRUCTURA DE LA BASE DE DATOS

### 📋 ENTIDADES PRINCIPALES

#### 👥 **USUARIOS** (Entidad Principal)
```
_id: ObjectId (PK)
nombre: String
apellido: String  
correo: String (UNIQUE)
contrasena: String
id_rol: Number (FK → Roles)
rut: String
telefono: String
curso_id: Number (FK → Cursos) [Solo para Alumnos]
tutor_id: ObjectId (FK → Usuarios) [Solo para Alumnos]
especialidad: String [Solo para Profesores]
fecha_nacimiento: Date [Solo para Alumnos]
```

#### 🎓 **CURSOS**
```
_id: Number (PK)
nombre: String
nivel: String
```

#### 📚 **ASIGNATURAS**
```
_id: Number (PK)
nombre: String
descripcion: String
curso_id: Number (FK → Cursos)
profesor_nombre: String (FK → Usuarios.nombre+apellido)
```

#### 📝 **NOTAS**
```
_id: ObjectId (PK)
alumno_correo: String (FK → Usuarios.correo)
asignatura_id: Number (FK → Asignaturas)
valor: Number
fecha: Date
tipo_evaluacion: String
observaciones: String
profesor_id: ObjectId (FK → Usuarios)
```

#### 📅 **ASISTENCIAS**
```
_id: ObjectId (PK)
alumno_correo: String (FK → Usuarios.correo)
asignatura_id: Number (FK → Asignaturas)
fecha: Date
estado: String (Presente|Ausente|Justificado)
```

#### 🕐 **HORARIOS**
```
_id: ObjectId (PK)
asignatura_id: Number (FK → Asignaturas)
curso_id: Number (FK → Cursos)
dia_semana: String
hora_inicio: String
hora_fin: String
aula: String
```

---

## 🔗 RELACIONES

### 1️⃣ **USUARIOS ↔ ROLES** (1:N)
- **Relación**: Un rol puede tener muchos usuarios
- **Clave**: `usuarios.id_rol`
- **Tipos de Rol**:
  - 1 = Administrador
  - 2 = Profesor  
  - 3 = Alumno
  - 4 = Tutor

### 2️⃣ **ALUMNOS ↔ CURSOS** (N:1)
- **Relación**: Muchos alumnos pertenecen a un curso
- **Clave**: `usuarios.curso_id → cursos._id`
- **Cardinalidad**: N:1

### 3️⃣ **TUTORES ↔ ALUMNOS** (1:N)
- **Relación**: Un tutor puede tener varios alumnos
- **Clave**: `usuarios.tutor_id → usuarios._id`
- **Cardinalidad**: 1:N

### 4️⃣ **CURSOS ↔ ASIGNATURAS** (1:N)
- **Relación**: Un curso tiene muchas asignaturas
- **Clave**: `asignaturas.curso_id → cursos._id`
- **Cardinalidad**: 1:N

### 5️⃣ **PROFESORES ↔ ASIGNATURAS** (1:N)
- **Relación**: Un profesor enseña varias asignaturas
- **Clave**: `asignaturas.profesor_nombre → usuarios.nombre+apellido`
- **Cardinalidad**: 1:N

### 6️⃣ **ALUMNOS ↔ NOTAS** (1:N)
- **Relación**: Un alumno tiene muchas notas
- **Clave**: `notas.alumno_correo → usuarios.correo`
- **Cardinalidad**: 1:N

### 7️⃣ **ASIGNATURAS ↔ NOTAS** (1:N)
- **Relación**: Una asignatura tiene muchas notas
- **Clave**: `notas.asignatura_id → asignaturas._id`
- **Cardinalidad**: 1:N

### 8️⃣ **ALUMNOS ↔ ASISTENCIAS** (1:N)
- **Relación**: Un alumno tiene muchas asistencias
- **Clave**: `asistencias.alumno_correo → usuarios.correo`
- **Cardinalidad**: 1:N

### 9️⃣ **ASIGNATURAS ↔ ASISTENCIAS** (1:N)
- **Relación**: Una asignatura tiene muchas asistencias
- **Clave**: `asistencias.asignatura_id → asignaturas._id`
- **Cardinalidad**: 1:N

### 🔟 **ASIGNATURAS ↔ HORARIOS** (1:N)
- **Relación**: Una asignatura puede tener varios horarios
- **Clave**: `horarios.asignatura_id → asignaturas._id`
- **Cardinalidad**: 1:N

---

## 📊 ESTADÍSTICAS ACTUALES

### 👥 **USUARIOS POR ROL**
- **Administradores**: 2
- **Profesores**: 6
- **Alumnos**: 4
- **Tutores**: 2
- **Total**: 14 usuarios

### 🎓 **DISTRIBUCIÓN POR CURSOS**
- **1° Medio A**: 3 alumnos, 4 asignaturas
- **1° Medio C**: 1 alumno, 2 asignaturas
- **Total**: 3 cursos

### 📚 **CONTENIDO ACADÉMICO**
- **Asignaturas**: 6 total
- **Notas**: 6 registros
- **Asistencias**: 6 registros
- **Horarios**: 3 programados

---

## 🔍 DIAGRAMA CONCEPTUAL

```
┌─────────────┐    1:N    ┌─────────────┐    1:N    ┌─────────────┐
│   CURSOS    │◄──────────│ ASIGNATURAS │◄──────────│   HORARIOS  │
│             │           │             │           │             │
│ _id (PK)    │           │ _id (PK)    │           │ _id (PK)    │
│ nombre      │           │ nombre      │           │ dia_semana  │
│ nivel       │           │ curso_id(FK)│           │ hora_inicio │
└─────────────┘           │profesor_nom │           │ hora_fin    │
      ▲                   └─────────────┘           │ aula        │
      │ N:1                      ▲                  └─────────────┘
      │                          │ 1:N
┌─────────────┐                  │
│  USUARIOS   │                  │
│             │                  │
│ _id (PK)    │                  │
│ nombre      │                  │
│ apellido    │                  │
│ correo      │                  │
│ id_rol      │                  │
│ curso_id(FK)│──────────────────┘
│ tutor_id(FK)│──┐
└─────────────┘  │ 1:N (Tutor-Alumno)
      ▲          │
      └──────────┘
      │ 1:N
      │
┌─────────────┐    N:1    ┌─────────────┐
│    NOTAS    │◄──────────│ ASISTENCIAS │
│             │           │             │
│ _id (PK)    │           │ _id (PK)    │
│alumno_correo│           │alumno_correo│
│asignatura_id│           │asignatura_id│
│ valor       │           │ estado      │
│ fecha       │           │ fecha       │
└─────────────┘           └─────────────┘
```

---

## 🎯 CARACTERÍSTICAS ESPECIALES

### 🔑 **CLAVES PRIMARIAS**
- **ObjectId**: usuarios, notas, asistencias, horarios
- **Numéricas**: cursos, asignaturas

### 🔗 **CLAVES FORÁNEAS**
- **Por ID**: curso_id, asignatura_id, tutor_id
- **Por Email**: alumno_correo (referencia a usuarios.correo)
- **Por Nombre**: profesor_nombre (referencia a usuarios.nombre+apellido)

### 📋 **INTEGRIDAD REFERENCIAL**
- Los alumnos deben tener un curso asignado
- Las notas y asistencias referencian alumnos por email
- Las asignaturas están vinculadas a cursos específicos
- Los horarios dependen de asignaturas y cursos

Este modelo permite gestionar completamente un sistema educativo con usuarios, cursos, asignaturas, evaluaciones y seguimiento de asistencia.