// Cambiar la versión cuando cambie el texto: a todos se les vuelve a pedir la autorización.
export const VERSION_POLITICA = '2026-10-21'

// Correo para ejercer los derechos de los titulares. Si queda vacío, se indica que se ejercen con el administrador.
export const CONTACTO_PRIVACIDAD = ''

export const politica = [
  {
    titulo: 'Quién trata tus datos',
    parrafos: [
      'PERMANECE+ es un proyecto académico de la Facultad de Ingenierías de la Universidad de Medellín (Proyecto de Ingenierías I). El equipo del proyecto es el responsable del tratamiento de los datos personales que se recogen en esta plataforma, conforme a la Ley 1581 de 2012 y sus decretos reglamentarios.',
    ],
  },
  {
    titulo: 'Qué datos recogemos',
    lista: [
      'Datos de tu cuenta: nombre, correo electrónico y el identificador que entrega el servicio de inicio de sesión.',
      'Datos que tú indicas: tu carrera y, si eres coordinador, el programa que coordinas.',
      'Tu promedio académico de cada periodo, solo si decides registrarlo. Es opcional.',
      'Datos de uso: las asesorías en las que te inscribes o que ofreces, la asistencia que registra el mentor, tus valoraciones y comentarios, tus solicitudes de asesoría (materia, tema, urgencia y horario sugerido) y tus notificaciones.',
    ],
    parrafos: ['No pedimos datos sensibles ni consultamos información de la universidad, como notas o historial de matrícula: tu promedio solo existe aquí si tú lo escribes.'],
  },
  {
    titulo: 'Para qué los usamos',
    lista: [
      'Crear tu cuenta y darte el acceso que corresponde a tu rol.',
      'Organizar las asesorías: publicarlas, inscribirte, agendar solicitudes y avisarte de cambios.',
      'Registrar cada sesión (asistencia, resumen y valoración) para dar seguimiento al acompañamiento.',
      'Elaborar reportes agregados por materia y programa para la coordinación, sin nombres de estudiantes.',
      'Medir si recibir asesorías se relaciona con un mejor promedio y con menos riesgo de deserción, comparando grupos de estudiantes en cifras agregadas.',
      'Mejorar el servicio y mantener la plataforma segura.',
    ],
  },
  {
    titulo: 'Quién puede ver tus datos',
    lista: [
      'El mentor o docente de una asesoría ve el nombre de quienes se inscribieron a ella.',
      'Los estudiantes ven el nombre de quien ofrece la asesoría.',
      'La coordinación ve reportes y comparaciones con cifras, no con nombres de estudiantes, y los mentores de su programa. Si un grupo tiene menos de 3 personas, la cifra no se muestra.',
      'Nadie ve tu promedio individual: solo entra en esas cifras agrupadas.',
      'El administrador ve el nombre, correo, rol y carrera de los usuarios para gestionar la plataforma.',
    ],
    parrafos: ['No vendemos ni cedemos tus datos a terceros con fines comerciales.'],
  },
  {
    titulo: 'Proveedores y transferencia de datos',
    parrafos: [
      'Para funcionar usamos servicios de terceros: Auth0 para el inicio de sesión, Neon para la base de datos y Vercel para el alojamiento. Estos proveedores pueden tener servidores fuera de Colombia, por lo que al aceptar autorizas que tus datos se transmitan y almacenen allí, solo para prestar el servicio.',
    ],
  },
  {
    titulo: 'Tus derechos',
    parrafos: ['Como titular de los datos puedes, en cualquier momento:'],
    lista: [
      'Conocer, actualizar y rectificar tus datos.',
      'Solicitar prueba de la autorización que diste y ser informado del uso que se hace de tus datos.',
      'Revocar la autorización y pedir que se eliminen tus datos, siempre que no exista un deber legal de conservarlos.',
      'Acceder de forma gratuita a tus datos personales.',
      'Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a la ley.',
    ],
  },
  {
    titulo: 'Autorización y conservación',
    parrafos: [
      'Tu autorización es voluntaria. Si no la das no podrás usar la plataforma, porque los datos anteriores son necesarios para prestar el servicio.',
      'Conservamos tus datos mientras tengas una cuenta y dure el proyecto. Si pides su eliminación, los borramos salvo lo que la ley nos obligue a guardar.',
    ],
  },
  {
    titulo: 'Seguridad',
    parrafos: [
      'El acceso es con una sesión iniciada, cada rol solo accede a los datos que necesita y las comunicaciones viajan cifradas. Ningún sistema es infalible, pero tomamos medidas razonables para protegerlos.',
    ],
  },
  {
    titulo: 'Cambios a esta política',
    parrafos: ['Si el texto cambia, te lo mostraremos de nuevo y te pediremos otra vez tu autorización.'],
  },
]
