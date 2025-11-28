const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://appUser:GxpfsoqSUWNbNtnh@sandbox.3rmnm.mongodb.net/?appName=Sandbox';
const client = new MongoClient(uri);

async function consultarEstructura() {
  try {
    await client.connect();
    const db = client.db('educontrol');
    
    console.log('=== ESTRUCTURA BASE DE DATOS EDUCONTROL ===\n');
    
    // Obtener todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log('📁 COLECCIONES ENCONTRADAS:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');
    
    // Analizar cada colección
    for (const collection of collections) {
      const colName = collection.name;
      console.log(`📋 COLECCIÓN: ${colName.toUpperCase()}`);
      console.log('─'.repeat(50));
      
      // Obtener documentos de muestra
      const samples = await db.collection(colName).find({}).limit(3).toArray();
      
      if (samples.length > 0) {
        console.log('📊 Estructura de campos:');
        const firstDoc = samples[0];
        
        Object.keys(firstDoc).forEach(key => {
          const value = firstDoc[key];
          const type = typeof value;
          const sample = type === 'object' && value !== null ? 
            (value instanceof Date ? value.toISOString().split('T')[0] : JSON.stringify(value)) : 
            String(value);
          
          console.log(`  • ${key}: ${type} (ej: ${sample.substring(0, 30)}${sample.length > 30 ? '...' : ''})`);
        });
        
        console.log(`\n📈 Total documentos: ${await db.collection(colName).countDocuments()}`);
        
        // Mostrar algunos ejemplos
        console.log('📝 Ejemplos:');
        samples.forEach((doc, index) => {
          const display = colName === 'usuarios' ? 
            `${doc.nombre} ${doc.apellido} (${doc.correo}) - Rol: ${doc.id_rol}` :
            colName === 'cursos' ? 
            `${doc.nombre} - ${doc.nivel}` :
            colName === 'asignaturas' ? 
            `${doc.nombre} - Curso: ${doc.curso_id} - Profesor: ${doc.profesor_nombre}` :
            colName === 'notas' ? 
            `Alumno: ${doc.alumno_correo} - Asignatura: ${doc.asignatura_id} - Nota: ${doc.valor}` :
            colName === 'asistencias' ? 
            `Alumno: ${doc.alumno_correo} - Asignatura: ${doc.asignatura_id} - Estado: ${doc.estado}` :
            JSON.stringify(doc).substring(0, 80) + '...';
          
          console.log(`  ${index + 1}. ${display}`);
        });
      } else {
        console.log('⚠️  Colección vacía');
      }
      
      console.log('\n');
    }
    
    // Analizar relaciones
    console.log('🔗 ANÁLISIS DE RELACIONES:');
    console.log('─'.repeat(50));
    
    const usuarios = await db.collection('usuarios').find({}).toArray();
    const cursos = await db.collection('cursos').find({}).toArray();
    const asignaturas = await db.collection('asignaturas').find({}).toArray();
    const notas = await db.collection('notas').find({}).toArray();
    const asistencias = await db.collection('asistencias').find({}).toArray();
    
    console.log('👥 USUARIOS por rol:');
    const rolesCounts = {};
    usuarios.forEach(u => {
      const roleName = u.id_rol === 1 ? 'Administrador' : 
                      u.id_rol === 2 ? 'Profesor' : 
                      u.id_rol === 3 ? 'Alumno' : 
                      u.id_rol === 4 ? 'Tutor' : 'Desconocido';
      rolesCounts[roleName] = (rolesCounts[roleName] || 0) + 1;
    });
    Object.entries(rolesCounts).forEach(([rol, count]) => {
      console.log(`  • ${rol}: ${count}`);
    });
    
    console.log('\n🎓 ALUMNOS por curso:');
    const alumnosPorCurso = {};
    usuarios.filter(u => u.id_rol === 3).forEach(alumno => {
      const cursoId = alumno.curso_id || 'Sin asignar';
      const curso = cursos.find(c => c._id === cursoId);
      const cursoNombre = curso ? curso.nombre : `Curso ID ${cursoId}`;
      alumnosPorCurso[cursoNombre] = (alumnosPorCurso[cursoNombre] || 0) + 1;
    });
    Object.entries(alumnosPorCurso).forEach(([curso, count]) => {
      console.log(`  • ${curso}: ${count} alumnos`);
    });
    
    console.log('\n📚 ASIGNATURAS por curso:');
    const asignaturasPorCurso = {};
    asignaturas.forEach(asig => {
      const curso = cursos.find(c => c._id === asig.curso_id);
      const cursoNombre = curso ? curso.nombre : `Curso ID ${asig.curso_id}`;
      asignaturasPorCurso[cursoNombre] = (asignaturasPorCurso[cursoNombre] || 0) + 1;
    });
    Object.entries(asignaturasPorCurso).forEach(([curso, count]) => {
      console.log(`  • ${curso}: ${count} asignaturas`);
    });
    
    console.log('\n👨‍🏫 TUTORES con alumnos asignados:');
    const tutores = usuarios.filter(u => u.id_rol === 4);
    tutores.forEach(tutor => {
      const alumnosAsignados = usuarios.filter(u => u.tutor_id === tutor._id).length;
      console.log(`  • ${tutor.nombre} ${tutor.apellido}: ${alumnosAsignados} alumnos`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

consultarEstructura();