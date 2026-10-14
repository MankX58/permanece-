// Contenido de la introducción que ve cada rol la primera vez que entra (y cuando su rol cambia).
// Cada paso responde: qué es esto, qué puedo hacer y qué se espera de mí.

const estudiante = {
  titulo: 'Bienvenido a PERMANECE+',
  subtitulo: 'Tu espacio de acompañamiento académico',
  pasos: [
    {
      titulo: 'Qué es PERMANECE+',
      texto:
        'Aquí encuentras apoyo de mentores y docentes en las materias que más se te dificultan, para que sigas avanzando en tu programa.',
      puntos: [
        'Las asesorías son gratuitas y las dan estudiantes avanzados y docentes.',
        'Pueden ser presenciales o virtuales, grupales o individuales.',
      ],
    },
    {
      titulo: 'Qué puedes hacer',
      texto: 'Todo está en el menú de la izquierda:',
      puntos: [
        'Banco de Asesorías: busca por materia e inscríbete en una sesión con cupo.',
        'Mis Solicitudes: si no hay una asesoría de tu materia, pídela y un mentor la tomará.',
        'Calendario: tus sesiones del mes, con la fecha, el lugar o el enlace.',
        'La campana te avisa cuando un mentor agenda, cambia o cancela algo.',
      ],
    },
    {
      titulo: 'Qué se espera de ti',
      texto: 'Los cupos son limitados y los mentores dedican su tiempo, así que:',
      puntos: [
        'Asiste a las sesiones en las que te inscribes, o cancela con anticipación para liberar el cupo.',
        'Entra con el enlace o llega al lugar a la hora acordada.',
        'Después de cada sesión, valórala y deja un comentario: así mejora el programa.',
      ],
    },
    {
      titulo: 'Cómo funciona una solicitud',
      texto: 'Desde que pides ayuda hasta que la recibes:',
      puntos: [
        '1. Envías la solicitud eligiendo la materia y el tema.',
        '2. Un mentor la acepta y agenda fecha, horario y modalidad.',
        '3. Recibes el aviso y la sesión aparece en tu calendario.',
        '4. Asistes, lees la retroalimentación del mentor y valoras la sesión.',
      ],
    },
  ],
}

const mentor = {
  titulo: 'Bienvenido al Portal de Mentores',
  subtitulo: 'Tu trabajo ayuda a que otros estudiantes permanezcan',
  pasos: [
    {
      titulo: 'Tu rol',
      texto:
        'Como mentor o docente acompañas a estudiantes en las materias donde necesitan apoyo. Tu portal reúne todo lo que haces en un solo lugar.',
      puntos: [
        'Los docentes aparecen en el banco con la etiqueta Docente Titular; los mentores, como Voluntario.',
        'Tus estudiantes ven tu nombre, tu calificación y tu retroalimentación.',
      ],
    },
    {
      titulo: 'Qué puedes hacer',
      texto: 'En el Portal de Mentores:',
      puntos: [
        'Nueva Disponibilidad: publica una sesión en el banco con fecha, horario, cupos y modalidad.',
        'Solicitudes disponibles: acepta las que puedas atender y luego agéndalas.',
        'Programadas: edita, agrega el enlace de la reunión o cancela (se avisa a los inscritos).',
        'Historial: asistentes, reseñas y tu retroalimentación de cada sesión.',
      ],
    },
    {
      titulo: 'Qué se espera de ti',
      texto: 'Para que los estudiantes puedan contar contigo:',
      puntos: [
        'Si la sesión es virtual, comparte el enlace de la reunión antes de que empiece.',
        'Después de cada sesión, registra quién asistió y deja tu retroalimentación.',
        'Si no puedes dar una sesión, cancélala a tiempo: los inscritos reciben el aviso.',
        'Publica solo lo que puedes cumplir.',
      ],
    },
    {
      titulo: 'Por qué importa tu registro',
      texto:
        'La asistencia y las reseñas que registras alimentan los informes por materia que usa la universidad para entender dónde hace falta más apoyo.',
      puntos: [
        'Una sesión sin asistencia registrada queda como “sin registrar” en el informe.',
        'Los informes son agregados: no muestran nombres de estudiantes.',
      ],
    },
  ],
}

const coordinador = {
  titulo: 'Bienvenido, coordinador de programa',
  subtitulo: 'La información de asesorías de tu programa',
  pasos: [
    {
      titulo: 'Tu rol',
      texto:
        'Ves cómo se comportan las asesorías de las materias del plan de formación de tu programa. Solo accedes a la información de tu programa.',
      puntos: [
        'El administrador te asigna el programa que coordinas.',
        'Si no ves datos, confirma con él que tu programa esté asignado.',
      ],
    },
    {
      titulo: 'Qué puedes hacer',
      texto: 'En Reportes:',
      puntos: [
        'Elegir un periodo o ver el total histórico.',
        'Consultar por materia: asesorías realizadas, asistencia, valoración y solicitudes (demanda).',
        'Ver también las materias de tu plan que no han tenido asesorías.',
        'Descargar todo en un archivo de Excel listo para compartir.',
      ],
    },
    {
      titulo: 'Las materias de tu programa',
      texto: 'En Materias mantienes al día la lista de tu programa:',
      puntos: [
        'Agregar una materia que ya se ve en otra carrera (queda compartida) o crear una nueva.',
        'Renombrar o quitar cualquier materia, incluidas las del plan oficial. Lo quitado se puede restaurar.',
        'Las materias comunes con otras carreras aparecen agrupadas aparte, y ves cuánto se usa cada una.',
        'Los cambios aparecen enseguida al pedir o publicar asesorías.',
      ],
    },
    {
      titulo: 'Cómo leer el informe',
      texto: 'Algunas definiciones para interpretar los números:',
      puntos: [
        '% de asistencia = asistieron ÷ (asistieron + no asistieron). No cuenta las “sin registrar”.',
        'Solicitudes recibidas muestra la demanda de apoyo por materia, haya o no asesoría disponible.',
        'Una materia compartida por varios programas se cuenta en cada uno.',
      ],
    },
    {
      titulo: 'Uso responsable de la información',
      texto: 'Los datos son agregados y no incluyen nombres de estudiantes.',
      puntos: [
        'Úsalos para comparar con el rendimiento académico de tu programa desde los sistemas de la universidad.',
        'Esa comparación se hace fuera de PERMANECE+.',
      ],
    },
  ],
}

const admin = {
  titulo: 'Bienvenido, administrador',
  subtitulo: 'Tienes la visión completa de la plataforma',
  pasos: [
    {
      titulo: 'Tu rol',
      texto:
        'Administras quién usa la plataforma y con qué permisos, y ves las métricas de todos los programas.',
      puntos: [
        'También puedes usar el banco y el portal de mentores como cualquier mentor.',
        'Hay cuatro perfiles: estudiante, mentor, docente y coordinador de programa, además del tuyo.',
      ],
    },
    {
      titulo: 'Qué puedes hacer',
      texto: 'En el menú de la izquierda:',
      puntos: [
        'Usuarios y Roles: asigna mentor, docente, coordinador (con su programa) o administrador.',
        'Reportes: asesorías, asistencia, valoración y demanda por materia y por programa.',
        'Descargar el informe completo, o el de un solo programa, en Excel.',
      ],
    },
    {
      titulo: 'Qué se espera de ti',
      texto: 'Con permisos amplios viene responsabilidad:',
      puntos: [
        'Asigna cada rol con criterio: da solo los permisos que la persona necesita.',
        'Al nombrar un coordinador, asígnale el programa que le corresponde.',
        'Revisa que los mentores registren la asistencia: de eso depende que los informes sean confiables.',
        'Maneja los informes como información confidencial de la institución.',
      ],
    },
  ],
}

// El docente comparte la introducción del mentor.
const porRol = { estudiante, mentor, docente: mentor, coordinador, admin }

export function introduccionDe(rol) {
  return porRol[rol] || estudiante
}
