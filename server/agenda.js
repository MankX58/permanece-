import { urgencias } from '../src/data.js'

// Solicitudes de asesoría y la negociación del horario entre estudiante y mentor.
//
// Estados de una solicitud:
//   disponible   mentor_id NULL. Tiene el horario que sugirió el estudiante.
//   propuesta    mentor_id = mentor, propuesta = { fecha, horario, virtual, lugar, enlace }.
//                El mentor propuso otro horario; espera que el estudiante acepte o rechace.
//   agendada     asesoria_id apunta a la sesión individual creada (asesoría privada de un cupo).
//
// - El mentor que acepta el horario sugerido agenda directo (el estudiante ya lo propuso).
// - Si el mentor propone otro horario, el estudiante lo acepta (se agenda) o lo rechaza: la solicitud
//   vuelve a estar disponible para cualquier mentor, opcionalmente con un horario sugerido nuevo.
// - El mentor puede retirar su propuesta en cualquier momento (también vuelve a estar disponible).

// Error con un mensaje para mostrarle al usuario tal cual (la ruta responde 400).
export class ErrorDeAgenda extends Error {}

// Normaliza los datos de una sesión: virtual no lleva lugar físico y presencial no lleva enlace.
export function datosSesion(s) {
  const virtual = s.virtual === true
  return {
    fecha: s.fecha,
    horario: s.horario,
    virtual,
    lugar: virtual ? 'Virtual' : String(s.lugar || '').trim(),
    enlace: virtual && s.enlace ? String(s.enlace).trim() : null,
  }
}

export function fechaLegible(fecha) {
  return fecha.split('-').reverse().join('/')
}

export function perfilDe(rol) {
  const esDocente = rol === 'docente'
  return {
    rol: esDocente ? 'Docente Titular' : 'Mentor Voluntario',
    tipo: esDocente ? 'Docente' : 'Voluntario',
  }
}

function textoSesion(sesion) {
  return fechaLegible(sesion.fecha) + ', ' + sesion.horario + ', ' + (sesion.virtual ? 'virtual' : 'en ' + sesion.lugar)
}

export function crearAgenda(sql, materias) {
  async function notificar(usuario, texto) {
    if (usuario) {
      await sql`INSERT INTO notificaciones (usuario_id, texto) VALUES (${usuario}, ${texto})`
    }
  }

  // Devuelve el mensaje de error de una sesión inválida, o null si está bien.
  async function errorDeSesion(sesion) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sesion.fecha || '')) {
      return 'Elige una fecha válida.'
    }
    if (!/^\d{2}:\d{2} - \d{2}:\d{2}$/.test(sesion.horario || '')) {
      return 'Revisa la hora de inicio y de fin.'
    }

    const [inicio, fin] = sesion.horario.split(' - ')
    if (fin <= inicio) {
      return 'La hora de fin debe ser posterior a la de inicio.'
    }
    if (!sesion.virtual && !sesion.lugar) {
      return 'Indica el lugar de la asesoría presencial.'
    }
    if (sesion.enlace && !/^https?:\/\/\S+$/i.test(sesion.enlace)) {
      return 'El enlace debe empezar por http:// o https://.'
    }

    try {
      const [{ futura }] = await sql`SELECT ${sesion.fecha}::date >= CURRENT_DATE AS futura`
      return futura ? null : 'La fecha no puede ser anterior a hoy.'
    } catch {
      return 'Elige una fecha válida.'
    }
  }

  // Día y hora que sugiere el estudiante (sin modalidad todavía).
  async function validarSugerencia(sugerencia) {
    if (!sugerencia?.fecha || !sugerencia?.horario) {
      throw new ErrorDeAgenda('Elige el día y la hora que te sirven para la asesoría.')
    }
    const error = await errorDeSesion({ fecha: sugerencia?.fecha, horario: sugerencia?.horario, virtual: true })
    if (error) throw new ErrorDeAgenda(error)
  }

  async function crearSolicitud(estudiante, datos) {
    const materia = String(datos.materia || '')
    const tema = String(datos.tema || '').trim()

    if (!(await materias.materiaValida(materia))) {
      throw new ErrorDeAgenda('Elige una materia de la lista.')
    }

    // El estudiante solo pide asesorías de materias de su carrera. Los demás roles, de cualquier materia.
    if (estudiante.rol === 'estudiante') {
      if (!estudiante.carrera) {
        throw new ErrorDeAgenda('Primero elige tu carrera.')
      }
      const deSuCarrera = (await materias.catalogo()).find((c) => c.nombre === estudiante.carrera)?.materias || []
      if (!deSuCarrera.includes(materia)) {
        throw new ErrorDeAgenda('Solo puedes pedir asesorías de materias de ' + estudiante.carrera + '.')
      }
    }
    if (tema.length === 0) {
      throw new ErrorDeAgenda('Cuéntale al mentor con qué tema necesitas ayuda.')
    }
    if (!urgencias.includes(datos.urgencia)) {
      throw new ErrorDeAgenda('Elige qué tan urgente es.')
    }
    await validarSugerencia(datos)

    await sql`
      INSERT INTO solicitudes (usuario_id, estudiante, materia, tema, urgencia, sugerida_fecha, sugerida_horario)
      VALUES (${estudiante.id}, ${estudiante.nombre}, ${materia}, ${tema}, ${datos.urgencia}, ${datos.fecha}, ${datos.horario})
    `

    // Avisa solo a quien puede atenderla: admins, y mentores o docentes que tienen asignada esta materia.
    await sql`
      INSERT INTO notificaciones (usuario_id, texto)
      SELECT u.id, ${'Nueva solicitud de ' + materia + ' (' + datos.urgencia.toLowerCase() + ').'}::text
      FROM usuarios u
      WHERE u.id <> ${estudiante.id}
        AND (
          u.rol = 'admin'
          OR (
            u.rol IN ('mentor', 'docente')
            AND EXISTS (SELECT 1 FROM mentor_materias mm WHERE mm.mentor_id = u.id AND mm.materia = ${materia})
          )
        )
    `
  }

  // Una solicitud que este mentor puede tomar: libre o ya reservada por él, sin sesión y sin atender.
  async function solicitudParaMentor(id, mentor) {
    const [solicitud] = await sql`
      SELECT id, usuario_id, materia, tema,
        to_char(sugerida_fecha, 'YYYY-MM-DD') AS fecha, sugerida_horario AS horario
      FROM solicitudes
      WHERE id = ${id}
        AND (mentor_id IS NULL OR mentor_id = ${mentor.id})
        AND asesoria_id IS NULL AND atendida_en IS NULL
    `
    if (!solicitud) {
      throw new ErrorDeAgenda('Esa solicitud ya no está disponible.')
    }
    if (!solicitud.usuario_id) {
      throw new ErrorDeAgenda('Esta solicitud no tiene un estudiante registrado.')
    }
    if (solicitud.usuario_id === mentor.id) {
      throw new ErrorDeAgenda('No puedes atender tu propia solicitud.')
    }
    return solicitud
  }

  async function validarMentor(mentor, materia, sesion) {
    if (!(await materias.puedeAtender(mentor, materia))) {
      throw new ErrorDeAgenda('Solo puedes atender las materias que tienes asignadas. Si no tienes ninguna, pídeselas a tu coordinador.')
    }
    const error = await errorDeSesion(sesion)
    if (error) throw new ErrorDeAgenda(error)
  }

  // Crea la sesión individual (asesoría privada de un cupo), inscribe al estudiante y la liga a la solicitud.
  async function crearSesion(id, solicitud, tutor, sesion) {
    const { rol, tipo } = perfilDe(tutor.rol)

    await sql`
      WITH nueva AS (
        INSERT INTO asesorias (tutor_id, tutor, rol, tipo, materia, descripcion, fecha, horario, lugar, virtual, enlace, cupos, privada)
        VALUES (${tutor.id}, ${tutor.nombre}, ${rol}, ${tipo}, ${solicitud.materia}, ${solicitud.tema},
                ${sesion.fecha}, ${sesion.horario}, ${sesion.lugar}, ${sesion.virtual}, ${sesion.enlace}, 1, true)
        RETURNING id
      ), inscrito AS (
        INSERT INTO inscripciones (usuario_id, asesoria_id)
        SELECT ${solicitud.usuario_id}::text, id FROM nueva
      )
      UPDATE solicitudes
      SET asesoria_id = (SELECT id FROM nueva), mentor_id = ${tutor.id}, propuesta = NULL
      WHERE id = ${id}
    `
  }

  // El mentor acepta el horario que sugirió el estudiante: se agenda de una vez.
  async function aceptarSugerencia(id, mentor, datos) {
    const solicitud = await solicitudParaMentor(id, mentor)
    if (!solicitud.fecha) {
      throw new ErrorDeAgenda('Esta solicitud no tiene horario sugerido: propón uno.')
    }

    const sesion = datosSesion({ ...datos, fecha: solicitud.fecha, horario: solicitud.horario })
    await validarMentor(mentor, solicitud.materia, sesion)

    // Reserva antes de crear la sesión, para que dos mentores no la tomen a la vez.
    const reservada = await sql`
      UPDATE solicitudes SET mentor_id = ${mentor.id}
      WHERE id = ${id} AND (mentor_id IS NULL OR mentor_id = ${mentor.id}) AND asesoria_id IS NULL
      RETURNING id
    `
    if (reservada.length === 0) {
      throw new ErrorDeAgenda('Esa solicitud ya no está disponible.')
    }

    await crearSesion(id, solicitud, mentor, sesion)
    await notificar(
      solicitud.usuario_id,
      mentor.nombre + ' aceptó tu horario y agendó la asesoría de ' + solicitud.materia + ': ' + textoSesion(sesion) + '.'
    )
  }

  // El mentor propone otro horario: queda reservada para él hasta que el estudiante responda.
  async function proponer(id, mentor, datos) {
    const solicitud = await solicitudParaMentor(id, mentor)
    const sesion = datosSesion(datos)
    await validarMentor(mentor, solicitud.materia, sesion)

    const propuesta = { ...sesion }
    const guardada = await sql`
      UPDATE solicitudes SET mentor_id = ${mentor.id}, propuesta = ${JSON.stringify(propuesta)}::jsonb
      WHERE id = ${id} AND (mentor_id IS NULL OR mentor_id = ${mentor.id}) AND asesoria_id IS NULL AND atendida_en IS NULL
      RETURNING id
    `
    if (guardada.length === 0) {
      throw new ErrorDeAgenda('Esa solicitud ya no está disponible.')
    }

    await notificar(
      solicitud.usuario_id,
      mentor.nombre + ' propone otro horario para tu asesoría de ' + solicitud.materia + ': ' + textoSesion(sesion) +
        '. Confírmalo o recházalo en Mis Solicitudes.'
    )
  }

  // El estudiante acepta (se agenda) o rechaza (vuelve a estar disponible) la propuesta del mentor.
  // Al rechazar puede sugerir un horario nuevo para los demás mentores.
  async function responder(id, estudiante, acepta, sugerencia = null) {
    const [solicitud] = await sql`
      SELECT s.usuario_id, s.materia, s.tema, s.mentor_id, s.propuesta, u.nombre AS mentor_nombre, u.rol AS mentor_rol
      FROM solicitudes s
      JOIN usuarios u ON u.id = s.mentor_id
      WHERE s.id = ${id} AND s.usuario_id = ${estudiante.id} AND s.propuesta IS NOT NULL AND s.asesoria_id IS NULL
    `
    if (!solicitud) {
      throw new ErrorDeAgenda('Esa propuesta ya no está vigente.')
    }

    if (acepta) {
      const sesion = datosSesion(solicitud.propuesta)
      const error = await errorDeSesion(sesion)
      if (error) {
        throw new ErrorDeAgenda(error + ' Rechaza la propuesta para que te propongan otro horario.')
      }

      const tutor = { id: solicitud.mentor_id, nombre: solicitud.mentor_nombre, rol: solicitud.mentor_rol }
      await crearSesion(id, solicitud, tutor, sesion)
      await notificar(
        solicitud.mentor_id,
        estudiante.nombre + ' aceptó tu propuesta: la asesoría de ' + solicitud.materia + ' quedó agendada para ' +
          textoSesion(sesion) + '.'
      )
      return
    }

    const nueva = sugerencia?.fecha ? sugerencia : null
    if (nueva) await validarSugerencia(nueva)

    await sql`
      UPDATE solicitudes
      SET mentor_id = NULL, propuesta = NULL,
          sugerida_fecha = COALESCE(${nueva?.fecha ?? null}::date, sugerida_fecha),
          sugerida_horario = COALESCE(${nueva?.horario ?? null}::text, sugerida_horario)
      WHERE id = ${id} AND usuario_id = ${estudiante.id} AND asesoria_id IS NULL
    `
    await notificar(
      solicitud.mentor_id,
      estudiante.nombre + ' no aceptó tu propuesta de horario para ' + solicitud.materia +
        '. La solicitud volvió a estar disponible.'
    )
  }

  // El mentor suelta la solicitud (o retira su propuesta): vuelve a estar disponible.
  async function liberar(id, mentor) {
    const [solicitud] = await sql`
      UPDATE solicitudes s
      SET mentor_id = NULL, propuesta = NULL
      FROM (SELECT id, propuesta IS NOT NULL AS tenia FROM solicitudes WHERE id = ${id}) antes
      WHERE s.id = antes.id AND s.mentor_id = ${mentor.id} AND s.atendida_en IS NULL AND s.asesoria_id IS NULL
      RETURNING s.usuario_id, s.materia, antes.tenia AS "teniaPropuesta"
    `
    if (!solicitud) return

    await notificar(
      solicitud.usuario_id,
      (solicitud.teniaPropuesta ? mentor.nombre + ' retiró su propuesta de horario. ' : '') +
        'Tu solicitud de ' + solicitud.materia + ' volvió a estar disponible para los mentores.'
    )
  }

  return { notificar, errorDeSesion, crearSolicitud, aceptarSugerencia, proponer, responder, liberar }
}
