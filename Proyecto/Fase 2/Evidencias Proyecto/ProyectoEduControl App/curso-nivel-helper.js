// ===== HELPER PARA OBTENER NIVEL DE CURSO =====
// Código JavaScript para obtener el nivel de un curso

/**
 * Función para obtener el nivel de un curso desde el backend
 * @param {number} cursoId - ID del curso (1-12)
 * @returns {Promise<string>} - Nivel del curso ('Básica', 'Media', o 'N/A')
 */
async function obtenerNivelCurso(cursoId) {
  try {
    const response = await fetch(`/api/cursos/${cursoId}/nivel`);
    const data = await response.json();
    
    if (data.success) {
      return data.nivel;
    } else {
      return 'N/A';
    }
  } catch (error) {
    console.error('Error obteniendo nivel del curso:', error);
    return 'N/A';
  }
}

/**
 * Función local para determinar nivel sin llamada al servidor
 * @param {number} cursoId - ID del curso (1-12)
 * @returns {string} - Nivel del curso
 */
function determinarNivelLocal(cursoId) {
  const id = parseInt(cursoId);
  
  if (id >= 1 && id <= 8) {
    return 'Básica';
  } else if (id >= 9 && id <= 12) {
    return 'Media';
  } else {
    return 'N/A';
  }
}

/**
 * Función para obtener nombre completo del curso con nivel
 * @param {number} cursoId - ID del curso
 * @returns {string} - Nombre completo (ej: "1° Básico - Básica")
 */
function obtenerNombreCompletoLocal(cursoId) {
  const id = parseInt(cursoId);
  const nombres = {
    1: '1° Básico',
    2: '2° Básico', 
    3: '3° Básico',
    4: '4° Básico',
    5: '5° Básico',
    6: '6° Básico',
    7: '7° Básico',
    8: '8° Básico',
    9: '1° Medio',
    10: '2° Medio',
    11: '3° Medio',
    12: '4° Medio'
  };
  
  const nombre = nombres[id] || `Curso ${id}`;
  const nivel = determinarNivelLocal(id);
  
  return `${nombre} - ${nivel}`;
}

// ===== EJEMPLOS DE USO =====

// Ejemplo 1: Usar en una función async
async function mostrarCursoConNivel(cursoId) {
  const nivel = await obtenerNivelCurso(cursoId);
  console.log(`Curso: ${cursoId}, Nivel: ${nivel}`);
  
  // Actualizar en el DOM
  const elemento = document.getElementById('curso-info');
  if (elemento) {
    elemento.textContent = `Curso: ${cursoId}, Nivel: ${nivel}`;
  }
}

// Ejemplo 2: Usar la función local (más rápida)
function mostrarCursoLocal(cursoId) {
  const nivel = determinarNivelLocal(cursoId);
  const nombreCompleto = obtenerNombreCompletoLocal(cursoId);
  
  console.log(`${nombreCompleto}`);
  
  // Actualizar en el DOM
  const elemento = document.getElementById('curso-info');
  if (elemento) {
    elemento.textContent = nombreCompleto;
  }
}

// Ejemplo 3: Para usar en Angular/Ionic
class CursoService {
  
  async obtenerNivel(cursoId) {
    try {
      const response = await fetch(`/api/cursos/${cursoId}/nivel`);
      const data = await response.json();
      return data.nivel || 'N/A';
    } catch (error) {
      console.error('Error:', error);
      return this.determinarNivelLocal(cursoId);
    }
  }
  
  determinarNivelLocal(cursoId) {
    const id = parseInt(cursoId);
    if (id >= 1 && id <= 8) return 'Básica';
    if (id >= 9 && id <= 12) return 'Media';
    return 'N/A';
  }
  
  obtenerNombreCompleto(cursoId) {
    const nombres = {
      1: '1° Básico', 2: '2° Básico', 3: '3° Básico', 4: '4° Básico',
      5: '5° Básico', 6: '6° Básico', 7: '7° Básico', 8: '8° Básico',
      9: '1° Medio', 10: '2° Medio', 11: '3° Medio', 12: '4° Medio'
    };
    
    const nombre = nombres[parseInt(cursoId)] || `Curso ${cursoId}`;
    const nivel = this.determinarNivelLocal(cursoId);
    
    return { nombre, nivel, completo: `${nombre} - ${nivel}` };
  }
}

// Ejemplo 4: Para usar con jQuery
$(document).ready(function() {
  
  // Función para actualizar todos los elementos con clase 'curso-nivel'
  function actualizarCursosEnPagina() {
    $('.curso-nivel').each(function() {
      const cursoId = $(this).data('curso-id');
      if (cursoId) {
        const nivel = determinarNivelLocal(cursoId);
        $(this).find('.nivel').text(nivel);
      }
    });
  }
  
  // Llamar la función al cargar la página
  actualizarCursosEnPagina();
});

// ===== PARA USAR EN HTML =====
/*
<!-- Ejemplo de HTML -->
<div class="curso-info" data-curso-id="9">
  <span class="curso-nombre">1° Medio</span>
  <span class="nivel"><!-- Se llenará con JavaScript --></span>
</div>

<script>
// Llenar niveles al cargar la página
document.addEventListener('DOMContentLoaded', function() {
  const elementos = document.querySelectorAll('.curso-info');
  elementos.forEach(elemento => {
    const cursoId = elemento.dataset.cursoId;
    const nivel = determinarNivelLocal(cursoId);
    const spanNivel = elemento.querySelector('.nivel');
    if (spanNivel) {
      spanNivel.textContent = nivel;
    }
  });
});
</script>
*/

// ===== EXPORTAR FUNCIONES (si usas módulos) =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    obtenerNivelCurso,
    determinarNivelLocal,
    obtenerNombreCompletoLocal,
    CursoService
  };
}