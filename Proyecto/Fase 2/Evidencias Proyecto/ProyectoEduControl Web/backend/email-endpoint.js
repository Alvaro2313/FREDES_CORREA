// Código para agregar a tu backend (server.js o archivo de rutas)

const nodemailer = require('nodemailer');

// Configurar transporter de correo
const transporter = nodemailer.createTransporter({
  service: 'gmail', // o tu proveedor de correo
  auth: {
    user: process.env.EMAIL_USER, // tu correo
    pass: process.env.EMAIL_PASS  // tu contraseña de aplicación
  }
});

// Modificar el endpoint POST /web/notas
app.post('/api/web/notas', async (req, res) => {
  try {
    const { id_alumno, id_asignatura, valor, fecha, enviar_correo } = req.body;

    // 1. Guardar la nota (lógica existente)
    const nuevaNota = {
      id_alumno,
      id_asignatura, 
      valor,
      fecha,
      // otros campos necesarios
    };
    
    // Aquí va tu lógica para guardar en la base de datos
    const notaGuardada = await guardarNota(nuevaNota);

    // 2. Si se solicita envío de correo
    if (enviar_correo) {
      // Obtener datos del alumno
      const alumno = await obtenerAlumnoPorId(id_alumno);
      
      // Obtener datos de la asignatura
      const asignatura = await obtenerAsignaturaPorId(id_asignatura);
      
      // Obtener tutor del alumno
      const tutor = await obtenerTutorPorAlumnoId(id_alumno);

      // Enviar correo al alumno
      if (alumno && alumno.correo) {
        const mailOptionsAlumno = {
          from: process.env.EMAIL_USER,
          to: alumno.correo,
          subject: `Nueva calificación en ${asignatura.nombre}`,
          html: `
            <h2>📚 Nueva Calificación Registrada</h2>
            <p>Hola <strong>${alumno.nombre}</strong>,</p>
            <p>Se ha registrado una nueva calificación en tu expediente académico:</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
              <ul style="list-style:none;padding:0;margin:0;">
                <li><strong>📖 Asignatura:</strong> ${asignatura.nombre}</li>
                <li><strong>📊 Calificación:</strong> <span style="font-size:1.2em;color:${valor >= 4.0 ? '#28a745' : '#dc3545'}">${valor}</span></li>
                <li><strong>📅 Fecha:</strong> ${new Date(fecha).toLocaleDateString('es-CL')}</li>
              </ul>
            </div>
            ${valor < 4.0 ? '<div style="background:#f8d7da;color:#721c24;padding:10px;border-radius:5px;margin:10px 0;"><strong>⚠️ Nota de Atención:</strong> Te recomendamos revisar esta materia y solicitar apoyo si lo necesitas.</div>' : '<div style="background:#d4edda;color:#155724;padding:10px;border-radius:5px;margin:10px 0;">🎉 ¡Excelente trabajo! Sigue así.</div>'}
            <p>Puedes revisar todas tus calificaciones en el portal EduControl.</p>
            <hr>
            <p><small>Este es un mensaje automático del sistema EduControl.</small></p>
          `
        };

        await transporter.sendMail(mailOptionsAlumno);
        console.log('Correo enviado al alumno:', alumno.correo);
      }

      // Enviar correo al tutor
      if (tutor && tutor.correo) {
        const mailOptionsTutor = {
          from: process.env.EMAIL_USER,
          to: tutor.correo,
          subject: `Nueva calificación para ${alumno.nombre} ${alumno.apellido}`,
          html: `
            <h2>📋 Notificación de Calificación</h2>
            <p>Estimado(a) <strong>${tutor.nombre} ${tutor.apellido}</strong>,</p>
            <p>Se ha registrado una nueva calificación para su alumno(a) bajo su tutoría:</p>
            <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
              <ul style="list-style:none;padding:0;margin:0;">
                <li><strong>👤 Alumno:</strong> ${alumno.nombre} ${alumno.apellido}</li>
                <li><strong>📖 Asignatura:</strong> ${asignatura.nombre}</li>
                <li><strong>📊 Calificación:</strong> <span style="font-size:1.2em;color:${valor >= 4.0 ? '#28a745' : '#dc3545'}">${valor}</span></li>
                <li><strong>📅 Fecha:</strong> ${new Date(fecha).toLocaleDateString('es-CL')}</li>
              </ul>
            </div>
            ${valor < 4.0 ? '<div style="background:#fff3cd;color:#856404;padding:15px;border-radius:5px;margin:15px 0;"><strong>⚠️ ATENCIÓN REQUERIDA:</strong><br>Esta calificación está por debajo del promedio esperado. Se recomienda:<ul><li>Contactar al alumno para ofrecer apoyo</li><li>Coordinar con el profesor de la asignatura</li><li>Establecer un plan de mejora académica</li></ul></div>' : '<div style="background:#d4edda;color:#155724;padding:10px;border-radius:5px;margin:10px 0;">✅ El alumno mantiene un buen rendimiento académico.</div>'}
            <p>Como tutor, puede brindar el apoyo necesario y hacer seguimiento del progreso académico.</p>
            <p><strong>Acciones recomendadas:</strong></p>
            <ul>
              <li>Revisar el historial completo de calificaciones</li>
              <li>Programar una reunión con el alumno si es necesario</li>
              <li>Contactar al profesor para más detalles</li>
            </ul>
            <p>Puede revisar más detalles en el portal EduControl.</p>
            <hr>
            <p><small>Este es un mensaje automático del sistema EduControl.</small></p>
          `
        };

        await transporter.sendMail(mailOptionsTutor);
        console.log('Correo enviado al tutor:', tutor.correo);
      }
    }

    res.status(200).json({ 
      message: enviar_correo ? 'Nota guardada y correos enviados' : 'Nota guardada correctamente',
      data: notaGuardada 
    });

  } catch (error) {
    console.error('Error al procesar la nota:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

// Funciones auxiliares que necesitas implementar según tu base de datos
async function obtenerAlumnoPorId(id) {
  // Implementar según tu base de datos
  // return await Alumno.findById(id);
}

async function obtenerAsignaturaPorId(id) {
  // Implementar según tu base de datos
  // return await Asignatura.findById(id);
}

async function obtenerTutorPorAlumnoId(alumnoId) {
  // Implementar según tu base de datos
  // const alumno = await Alumno.findById(alumnoId).populate('tutor');
  // return alumno.tutor;
}

async function guardarNota(nota) {
  // Implementar según tu base de datos
  // return await Nota.create(nota);
}