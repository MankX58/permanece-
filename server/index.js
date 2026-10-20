import express from 'express'
import { auth } from 'express-oauth2-jwt-bearer'
import { neon } from '@neondatabase/serverless'
import { areas, carreras } from '../src/data.js'
import { construirReporte, generarExcel } from './reportes.js'
import { crearMaterias, ErrorDeMateria } from './materias.js'
import { crearAgenda, datosSesion, perfilDe, ErrorDeAgenda } from './agenda.js'

const sql = neon(process.env.DATABASE_URL)
const app = express()

app.use(express.json())

app.use(
  '/api',
  auth({
    audience: process.env.VITE_AUTH0_CLIENT_ID,
    issuerBaseURL: 'https://' + process.env.VITE_AUTH0_DOMAIN,
  })
)

app.use('/api', async (req, res, next) => {
  const sesion = req.auth.payload
  const [usuario] = await sql`
    INSERT INTO usuarios (id, nombre, email, rol)
    VALUES (
      ${sesion.sub}, ${sesion.name}, ${sesion.email},
      CASE WHEN (SELECT COUNT(*) FROM usuarios) = 0 THEN 'admin' ELSE 'estudiante' END
    )
    ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, email = EXCLUDED.email
    RETURNING id, nombre, email, rol, programa, introduccion_vista AS "introduccionVista"
  `
  req.usuario = usuario
  next()
})

function idUsuario(req) {
  return req.usuario.id
}

function soloRoles(...roles) {
  return (req, res, next) => {
    if (roles.includes(req.usuario.rol)) {
      next()
    } else {
      res.status(403).json({ mensaje: 'Tu rol no tiene permiso para hacer esto.' })
    }
  }
}

const soloMentores = soloRoles('mentor', 'docente', 'admin')
const soloAdmin = soloRoles('admin')
const soloReportes = soloRoles('admin', 'coordinador')
const soloCoordinacion = soloRoles('admin', 'coordinador')

const ROLES = ['estudiante', 'mentor', 'docente', 'coordinador', 'admin']

function programaValido(programa) {
  return carreras.some((carrera) => carrera.nombre === programa)
}

// Catálogo de materias por carrera (plan oficial ajustado por la coordinación): ver server/materias.js.
const materias = crearMaterias(sql)
const catalogo = materias.catalogo
const materiaValida = materias.materiaValida

// Solicitudes y negociación del horario: ver server/agenda.js.
const agenda = crearAgenda(sql, materias)
const notificar = agenda.notificar
const errorDeSesion = agenda.errorDeSesion

function perfilTutor(req) {
  return perfilDe(req.usuario.rol)
}

function buscarAsesorias(usuario) {
  return sql`
    SELECT
      a.id, a.tutor, a.rol, a.tipo, a.area, a.materia, a.descripcion,
      to_char(a.fecha, 'YYYY-MM-DD') AS fecha,
      a.horario, a.lugar, a.virtual, a.enlace, a.cupos, a.privada,
      CASE WHEN a.tutor_id = ${usuario} OR mia.usuario_id IS NOT NULL THEN a.resumen END AS resumen,
      a.fecha < CURRENT_DATE AS pasada,
      (SELECT COUNT(*)::int FROM inscripciones i WHERE i.asesoria_id = a.id) AS inscritos,
      mia.usuario_id IS NOT NULL AS inscrita,
      mia.valoracion AS "miValoracion",
      mia.comentario AS "miComentario",
      mia.asistio AS "miAsistio",
      COALESCE(a.tutor_id = ${usuario}, false) AS "esMia",
      CASE WHEN a.tutor_id = ${usuario} THEN (
        SELECT COALESCE(
          json_agg(
            json_build_object('id', i.usuario_id, 'nombre', COALESCE(u.nombre, 'Estudiante'), 'asistio', i.asistio, 'valoracion', i.valoracion, 'comentario', i.comentario)
            ORDER BY u.nombre
          ),
          '[]'::json
        )
        FROM inscripciones i
        LEFT JOIN usuarios u ON u.id = i.usuario_id
        WHERE i.asesoria_id = a.id
      ) END AS asistentes
    FROM asesorias a
    LEFT JOIN inscripciones mia ON mia.asesoria_id = a.id AND mia.usuario_id = ${usuario}
    WHERE NOT a.privada OR a.tutor_id = ${usuario} OR mia.usuario_id IS NOT NULL
    ORDER BY a.fecha, a.horario
  `
}

function buscarSolicitudes(usuario, esMentor) {
  return sql`
    SELECT
      s.id, s.estudiante, s.materia, s.tema, s.urgencia,
      COALESCE(s.usuario_id = ${usuario}, false) AS "esMia",
      s.mentor_id IS NOT NULL AS aceptada,
      COALESCE(s.mentor_id = ${usuario}, false) AS "aceptadaPorMi",
      s.atendida_en IS NOT NULL AS atendida,
      s.asesoria_id AS "asesoriaId",
      to_char(s.sugerida_fecha, 'YYYY-MM-DD') AS "sugeridaFecha",
      s.sugerida_horario AS "sugeridaHorario",
      CASE WHEN s.usuario_id = ${usuario} OR s.mentor_id = ${usuario} THEN s.propuesta END AS propuesta,
      to_char(s.creada_en AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS creada,
      to_char(s.atendida_en AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS "atendidaEn",
      m.nombre AS mentor
    FROM solicitudes s
    LEFT JOIN usuarios m ON m.id = s.mentor_id
    WHERE s.usuario_id = ${usuario} OR (${esMentor} AND (s.mentor_id = ${usuario} OR s.mentor_id IS NULL))
    ORDER BY s.id
  `
}

function buscarNotificaciones(usuario) {
  return sql`
    SELECT id, texto
    FROM notificaciones
    WHERE usuario_id = ${usuario} AND leida = false
    ORDER BY id DESC
  `
}

function buscarUsuarios() {
  return sql`SELECT id, nombre, email, rol, programa FROM usuarios ORDER BY nombre`
}

app.get('/api/datos', async (req, res) => {
  const yo = req.usuario
  const esMentor = ['mentor', 'docente', 'admin'].includes(yo.rol)
  const esAdmin = yo.rol === 'admin'

  const esCoordinacion = esAdmin || yo.rol === 'coordinador'

  const [asesorias, solicitudes, notificaciones, usuarios, vigente, asignadas, mentores] = await Promise.all([
    buscarAsesorias(yo.id),
    buscarSolicitudes(yo.id, esMentor),
    buscarNotificaciones(yo.id),
    esAdmin ? buscarUsuarios() : [],
    catalogo(),
    ['mentor', 'docente'].includes(yo.rol) ? materias.asignadasA(yo.id) : null,
    esCoordinacion ? materias.mentoresConMaterias() : [],
  ])

  // materiasAsignadas: lista de materias que el mentor o docente puede atender; null = sin restricción (admin).
  res.json({
    yo: { ...yo, materiasAsignadas: asignadas },
    asesorias,
    solicitudes,
    notificaciones,
    usuarios,
    catalogo: vigente,
    mentores,
  })
})

// Cambia el rol de un usuario. El coordinador lleva además el programa (carrera) que coordina.
app.put('/api/usuarios/:id/rol', soloAdmin, async (req, res) => {
  const { rol, programa } = req.body

  if (!ROLES.includes(rol)) {
    return res.status(400).json({ mensaje: 'Ese rol no existe.' })
  }
  if (req.params.id === idUsuario(req)) {
    return res.status(400).json({ mensaje: 'No puedes cambiar tu propio rol.' })
  }
  if (rol === 'coordinador' && programa && !programaValido(programa)) {
    return res.status(400).json({ mensaje: 'Ese programa no existe en el catálogo.' })
  }

  const programaFinal = rol === 'coordinador' ? programa || null : null
  const [antes] = await sql`SELECT rol, programa FROM usuarios WHERE id = ${req.params.id}`

  await sql`UPDATE usuarios SET rol = ${rol}, programa = ${programaFinal} WHERE id = ${req.params.id}`

  if (rol === 'coordinador' && programaFinal) {
    await notificar(req.params.id, 'Ahora coordinas el programa ' + programaFinal + '. Encuentras sus reportes en el menú.')
  } else if (!antes || antes.rol !== rol) {
    await notificar(req.params.id, 'Tu rol ahora es ' + rol + '.')
  }
  res.json({ ok: true })
})

// El usuario terminó (u omitió) la introducción de su rol: no vuelve a salir hasta que el rol cambie.
app.post('/api/introduccion/vista', async (req, res) => {
  await sql`UPDATE usuarios SET introduccion_vista = ${req.usuario.rol} WHERE id = ${idUsuario(req)}`
  res.json({ ok: true })
})

// Asistencia que el mentor registra después de la sesión: alimenta los reportes.
app.put('/api/asesorias/:id/asistencia/:usuario', soloMentores, async (req, res) => {
  if (typeof req.body.asistio !== 'boolean') {
    return res.status(400).json({ mensaje: 'Indica si el estudiante asistió o no.' })
  }

  const actualizadas = await sql`
    UPDATE inscripciones i
    SET asistio = ${req.body.asistio}
    FROM asesorias a
    WHERE a.id = i.asesoria_id
      AND i.asesoria_id = ${req.params.id}
      AND i.usuario_id = ${req.params.usuario}
      AND a.tutor_id = ${idUsuario(req)}
      AND a.fecha < CURRENT_DATE
    RETURNING i.usuario_id
  `

  if (actualizadas.length === 0) {
    return res.status(400).json({ mensaje: 'Solo puedes registrar la asistencia de tus sesiones ya realizadas.' })
  }
  res.json({ ok: true })
})

// ------------------------------------------------------------------ Reportes (admin y coordinador)

function fechaOpcional(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor || '') ? valor : null
}

// El coordinador solo ve su programa, sin importar lo que pida; el admin elige uno o ve todos.
function filtrosDeReporte(req) {
  const desde = fechaOpcional(req.query.desde)
  const hasta = fechaOpcional(req.query.hasta)

  if (req.usuario.rol === 'coordinador') {
    return { desde, hasta, programa: req.usuario.programa || null, sinPrograma: !req.usuario.programa }
  }

  const programa = programaValido(req.query.programa) ? req.query.programa : null
  return { desde, hasta, programa, sinPrograma: false }
}

app.get('/api/reportes', soloReportes, async (req, res) => {
  const { desde, hasta, programa, sinPrograma } = filtrosDeReporte(req)

  if (sinPrograma) {
    return res.status(400).json({ mensaje: 'Aún no tienes un programa asignado. Pídele al administrador que lo asigne.' })
  }

  res.json(await construirReporte(sql, { desde, hasta, programa, carreras: await catalogo() }))
})

app.get('/api/reportes/excel', soloReportes, async (req, res) => {
  const { desde, hasta, programa, sinPrograma } = filtrosDeReporte(req)

  if (sinPrograma) {
    return res.status(400).json({ mensaje: 'Aún no tienes un programa asignado. Pídele al administrador que lo asigne.' })
  }

  const reporte = await construirReporte(sql, { desde, hasta, programa, carreras: await catalogo() })
  const archivo = await generarExcel(reporte, { generadoPor: req.usuario.nombre, rol: req.usuario.rol })

  const nombre = 'informe-asesorias' + (programa ? '-' + programa.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '') + '.xlsx'
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="' + nombre + '"')
  res.send(archivo)
})

// ------------------------------------------------------------------ Materias por carrera (admin y coordinador)

// El coordinador solo cambia las materias de su programa; el admin, las de cualquiera.
// Devuelve el mensaje de error, o null si puede.
function errorDeCarrera(req, carrera) {
  if (!programaValido(carrera)) {
    return 'Esa carrera no existe en el catálogo.'
  }
  if (req.usuario.rol === 'coordinador' && carrera !== req.usuario.programa) {
    return 'Solo puedes cambiar las materias de tu programa.'
  }
  return null
}

// Suma una materia a la carrera: una que ya se ve en otra carrera, una nueva, o una del plan que se había quitado.
app.post('/api/materias', soloCoordinacion, async (req, res) => {
  const carrera = String(req.body.carrera || '')
  const error = errorDeCarrera(req, carrera)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }
  await conRegla(res, () => materias.agregar(carrera, req.body.materia, idUsuario(req)))
})

// Saca una materia de la carrera, sea del plan oficial o agregada. El historial no se borra.
app.delete('/api/materias', soloCoordinacion, async (req, res) => {
  const carrera = String(req.body.carrera || '')
  const error = errorDeCarrera(req, carrera)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }
  await conRegla(res, () => materias.quitar(carrera, String(req.body.materia || ''), idUsuario(req)))
})

// Renombra una materia de la carrera (las reglas están en server/materias.js). Solo el admin puede pedir "enTodas".
app.put('/api/materias', soloCoordinacion, async (req, res) => {
  const carrera = String(req.body.carrera || '')
  const error = errorDeCarrera(req, carrera)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }
  const enTodas = req.body.enTodas === true && req.usuario.rol === 'admin'
  await conRegla(res, () =>
    materias.renombrar(carrera, String(req.body.materia || ''), req.body.nuevo, idUsuario(req), enTodas)
  )
})

// Cuánto se usa cada materia de la carrera, para decidir con datos antes de quitarla o renombrarla.
app.get('/api/materias/uso', soloCoordinacion, async (req, res) => {
  const carrera = String(req.query.carrera || '')
  const error = errorDeCarrera(req, carrera)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }
  res.json(await materias.uso(carrera))
})

app.post('/api/asesorias', soloMentores, async (req, res) => {
  const a = req.body

  if (!(await materiaValida(a.materia))) {
    return res.status(400).json({ mensaje: 'Elige una materia de la lista.' })
  }
  if (!(await materias.puedeAtender(req.usuario, a.materia))) {
    return res.status(400).json({
      mensaje: 'Solo puedes publicar asesorías de las materias que tienes asignadas. Si no tienes ninguna, pídeselas a tu coordinador.',
    })
  }

  const cupos = Number(a.cupos)
  if (!areas.includes(a.area) || !Number.isInteger(cupos) || cupos < 1) {
    return res.status(400).json({ mensaje: 'Revisa el área y los cupos.' })
  }

  const sesion = datosSesion(a)
  const error = await errorDeSesion(sesion)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }

  const { rol, tipo } = perfilTutor(req)

  await sql`
    INSERT INTO asesorias (tutor_id, tutor, rol, tipo, area, materia, descripcion, fecha, horario, lugar, virtual, enlace, cupos)
    VALUES (${idUsuario(req)}, ${req.usuario.nombre}, ${rol}, ${tipo}, ${a.area}, ${a.materia}, ${a.descripcion}, ${sesion.fecha}, ${sesion.horario}, ${sesion.lugar}, ${sesion.virtual}, ${sesion.enlace}, ${cupos})
  `

  // Quienes tenían una solicitud pendiente de esta materia se enteran de que ya hay una sesión.
  await sql`
    INSERT INTO notificaciones (usuario_id, texto)
    SELECT DISTINCT usuario_id, ${'Hay una nueva asesoría de ' + a.materia + ' en el banco.'}::text
    FROM solicitudes
    WHERE materia = ${a.materia} AND mentor_id IS NULL AND usuario_id IS NOT NULL AND usuario_id <> ${idUsuario(req)}
  `
  res.json({ ok: true })
})

// Cambiar fecha, horario, lugar o enlace de una asesoría próxima. Los inscritos reciben el aviso.
app.put('/api/asesorias/:id', soloMentores, async (req, res) => {
  const [actual] = await sql`
    SELECT materia, enlace, virtual FROM asesorias
    WHERE id = ${req.params.id} AND tutor_id = ${idUsuario(req)} AND fecha >= CURRENT_DATE
  `

  if (!actual) {
    return res.status(400).json({ mensaje: 'Solo puedes editar asesorías próximas tuyas.' })
  }

  const sesion = datosSesion(req.body)
  const error = await errorDeSesion(sesion)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }

  // ¿Cambió algo además del enlace? Si solo cambió el enlace el aviso es más específico.
  const sinCambios = await sql`
    SELECT 1 FROM asesorias
    WHERE id = ${req.params.id} AND fecha = ${sesion.fecha}::date AND horario = ${sesion.horario}
      AND lugar = ${sesion.lugar} AND virtual = ${sesion.virtual}
  `
  const mismosDatos = sinCambios.length > 0

  await sql`
    UPDATE asesorias
    SET fecha = ${sesion.fecha}, horario = ${sesion.horario}, lugar = ${sesion.lugar},
        virtual = ${sesion.virtual}, enlace = ${sesion.enlace}
    WHERE id = ${req.params.id}
  `

  let aviso = 'Se actualizaron los datos de la asesoría de ' + actual.materia + '.'
  if (mismosDatos && sesion.enlace && sesion.enlace !== actual.enlace) {
    aviso = 'Ya está disponible el enlace de la asesoría de ' + actual.materia + '.'
  } else if (mismosDatos) {
    return res.json({ ok: true })
  }

  await sql`
    INSERT INTO notificaciones (usuario_id, texto)
    SELECT usuario_id, ${aviso}::text FROM inscripciones WHERE asesoria_id = ${req.params.id}
  `
  res.json({ ok: true })
})

// Retroalimentación del mentor sobre una sesión que ya pasó; la ven los inscritos.
app.put('/api/asesorias/:id/resumen', soloMentores, async (req, res) => {
  const resumen = String(req.body.resumen || '').trim()

  if (resumen.length === 0) {
    return res.status(400).json({ mensaje: 'Escribe la retroalimentación antes de guardar.' })
  }

  const [asesoria] = await sql`
    SELECT materia, resumen FROM asesorias
    WHERE id = ${req.params.id} AND tutor_id = ${idUsuario(req)} AND fecha < CURRENT_DATE
  `

  if (!asesoria) {
    return res.status(400).json({ mensaje: 'Solo puedes dejar retroalimentación de tus asesorías ya realizadas.' })
  }

  await sql`UPDATE asesorias SET resumen = ${resumen} WHERE id = ${req.params.id}`

  if (!asesoria.resumen) {
    await sql`
      INSERT INTO notificaciones (usuario_id, texto)
      SELECT usuario_id, ${req.usuario.nombre + ' dejó la retroalimentación de la asesoría de ' + asesoria.materia + '. Ya puedes valorarla.'}::text
      FROM inscripciones WHERE asesoria_id = ${req.params.id}
    `
  }
  res.json({ ok: true })
})

app.delete('/api/asesorias/:id', soloMentores, async (req, res) => {
  const [asesoria] = await sql`
    SELECT materia FROM asesorias
    WHERE id = ${req.params.id} AND tutor_id = ${idUsuario(req)} AND fecha >= CURRENT_DATE
  `

  // Solo se cancelan las próximas: las pasadas quedan como historial.
  if (!asesoria) {
    return res.status(400).json({ mensaje: 'Solo puedes cancelar asesorías próximas tuyas.' })
  }

  await sql`
    INSERT INTO notificaciones (usuario_id, texto)
    SELECT usuario_id, ${'Se canceló la asesoría de ' + asesoria.materia + ' a la que estabas inscrito.'}::text
    FROM inscripciones
    WHERE asesoria_id = ${req.params.id}
  `
  await sql`DELETE FROM asesorias WHERE id = ${req.params.id}`
  res.json({ ok: true })
})

app.post('/api/asesorias/:id/inscripcion', async (req, res) => {
  const usuario = idUsuario(req)
  const [asesoria] = await sql`
    SELECT
      a.tutor_id, a.materia, a.cupos, a.privada,
      a.fecha < CURRENT_DATE AS pasada,
      (SELECT COUNT(*)::int FROM inscripciones i WHERE i.asesoria_id = a.id) AS inscritos
    FROM asesorias a
    WHERE a.id = ${req.params.id}
  `

  if (!asesoria || asesoria.privada) {
    return res.status(404).json({ mensaje: 'La asesoría no existe.' })
  }
  if (asesoria.pasada) {
    return res.status(400).json({ mensaje: 'Esta asesoría ya pasó.' })
  }
  if (asesoria.tutor_id === usuario) {
    return res.status(400).json({ mensaje: 'No puedes inscribirte a tu propia asesoría.' })
  }
  if (asesoria.inscritos >= asesoria.cupos) {
    return res.status(400).json({ mensaje: 'Ya no hay cupos.' })
  }

  const nuevas = await sql`
    INSERT INTO inscripciones (usuario_id, asesoria_id)
    VALUES (${usuario}, ${req.params.id})
    ON CONFLICT DO NOTHING
    RETURNING asesoria_id
  `
  if (nuevas.length > 0) {
    await notificar(asesoria.tutor_id, req.usuario.nombre + ' se inscribió a tu asesoría de ' + asesoria.materia + '.')
  }
  res.json({ ok: true })
})

app.delete('/api/asesorias/:id/inscripcion', async (req, res) => {
  const [privada] = await sql`SELECT 1 FROM asesorias WHERE id = ${req.params.id} AND privada`

  if (privada) {
    return res.status(400).json({
      mensaje: 'Es una sesión individual. Elimina tu solicitud o pídele al mentor que la cancele.',
    })
  }

  await sql`
    DELETE FROM inscripciones
    WHERE usuario_id = ${idUsuario(req)} AND asesoria_id = ${req.params.id}
  `
  res.json({ ok: true })
})

app.put('/api/asesorias/:id/valoracion', async (req, res) => {
  const valoracion = Number(req.body.valoracion)
  const comentario = req.body.comentario || null

  if (!Number.isInteger(valoracion) || valoracion < 1 || valoracion > 5) {
    return res.status(400).json({ mensaje: 'La valoración debe ser de 1 a 5 estrellas.' })
  }

  const [asesoria] = await sql`
    UPDATE inscripciones i
    SET valoracion = ${valoracion}, comentario = ${comentario}
    FROM asesorias a
    WHERE a.id = i.asesoria_id
      AND i.asesoria_id = ${req.params.id}
      AND i.usuario_id = ${idUsuario(req)}
      AND a.fecha < CURRENT_DATE
    RETURNING a.tutor_id, a.materia
  `

  if (!asesoria) {
    return res.status(400).json({ mensaje: 'Solo puedes valorar asesorías a las que ya asististe.' })
  }

  await notificar(asesoria.tutor_id, 'Recibiste una reseña de ' + valoracion + ' estrellas en ' + asesoria.materia + '.')
  res.json({ ok: true })
})

// Responde 400 con el mensaje si la operación falló por una regla de negocio; lo demás sigue al manejador general.
async function conRegla(res, operacion) {
  try {
    res.json((await operacion()) ?? { ok: true })
  } catch (error) {
    if (error instanceof ErrorDeAgenda || error instanceof ErrorDeMateria) {
      return res.status(400).json({ mensaje: error.message })
    }
    throw error
  }
}

// El estudiante pide una asesoría y sugiere día y hora.
app.post('/api/solicitudes', async (req, res) => {
  await conRegla(res, () => agenda.crearSolicitud(req.usuario, req.body))
})

app.delete('/api/solicitudes/:id', async (req, res) => {
  const [solicitud] = await sql`
    SELECT mentor_id, materia, asesoria_id FROM solicitudes
    WHERE id = ${req.params.id} AND usuario_id = ${idUsuario(req)}
  `

  // Si ya tenía una sesión próxima agendada, se cancela y el mentor se entera. Las pasadas quedan en el historial.
  if (solicitud?.asesoria_id) {
    const canceladas = await sql`
      DELETE FROM asesorias WHERE id = ${solicitud.asesoria_id} AND fecha >= CURRENT_DATE RETURNING id
    `
    if (canceladas.length > 0) {
      await notificar(solicitud.mentor_id, req.usuario.nombre + ' canceló la asesoría de ' + solicitud.materia + '.')
    }
  }

  await sql`DELETE FROM solicitudes WHERE id = ${req.params.id} AND usuario_id = ${idUsuario(req)}`
  res.json({ ok: true })
})

// El mentor acepta el horario que sugirió el estudiante: queda agendada de una vez.
// Cuerpo: { area, virtual, lugar, enlace }.
app.post('/api/solicitudes/:id/aceptar', soloMentores, async (req, res) => {
  await conRegla(res, () => agenda.aceptarSugerencia(req.params.id, req.usuario, req.body))
})

// El mentor propone otro horario; el estudiante debe aceptarlo. Cuerpo: { area, fecha, horario, virtual, lugar, enlace }.
app.post('/api/solicitudes/:id/proponer', soloMentores, async (req, res) => {
  await conRegla(res, () => agenda.proponer(req.params.id, req.usuario, req.body))
})

// El estudiante acepta o rechaza la propuesta. Cuerpo: { acepta, fecha?, horario? } (horario nuevo al rechazar).
app.post('/api/solicitudes/:id/responder', async (req, res) => {
  const sugerencia = req.body.fecha ? { fecha: req.body.fecha, horario: req.body.horario } : null
  await conRegla(res, () => agenda.responder(req.params.id, req.usuario, req.body.acepta === true, sugerencia))
})

// El mentor suelta la solicitud o retira su propuesta: vuelve a estar disponible.
app.post('/api/solicitudes/:id/liberar', soloMentores, async (req, res) => {
  await conRegla(res, () => agenda.liberar(req.params.id, req.usuario))
})

// Resolver una solicitud sin sesión programada (por ejemplo, ya se respondió por chat).
app.post('/api/solicitudes/:id/atender', soloMentores, async (req, res) => {
  const [solicitud] = await sql`
    UPDATE solicitudes
    SET atendida_en = now()
    WHERE id = ${req.params.id} AND mentor_id = ${idUsuario(req)} AND atendida_en IS NULL AND asesoria_id IS NULL
    RETURNING usuario_id, materia
  `

  if (!solicitud) {
    return res.status(400).json({ mensaje: 'Esa solicitud no está en tu lista de pendientes por atender.' })
  }

  await notificar(solicitud.usuario_id, req.usuario.nombre + ' marcó como atendida tu solicitud de ' + solicitud.materia + '.')
  res.json({ ok: true })
})

// ------------------------------------------------------------------ Materias asignadas a los mentores estudiantes

// El coordinador solo asigna y quita materias de su programa; el admin, cualquiera.
function carreraPermitida(req) {
  return req.usuario.rol === 'coordinador' ? req.usuario.programa || '' : null
}

app.post('/api/mentores/:id/materias', soloCoordinacion, async (req, res) => {
  const materia = String(req.body.materia || '')
  await conRegla(res, async () => {
    await materias.asignar(req.params.id, materia, idUsuario(req), carreraPermitida(req))
    await notificar(req.params.id, 'Ahora atiendes ' + materia + '. Verás sus solicitudes y podrás publicar asesorías de esa materia.')
  })
})

app.delete('/api/mentores/:id/materias', soloCoordinacion, async (req, res) => {
  const materia = String(req.body.materia || '')
  await conRegla(res, async () => {
    await materias.desasignar(req.params.id, materia, carreraPermitida(req))
    await notificar(req.params.id, 'Ya no tienes asignada ' + materia + '.')
  })
})

app.post('/api/notificaciones/leidas', async (req, res) => {
  await sql`UPDATE notificaciones SET leida = true WHERE usuario_id = ${idUsuario(req)}`
  res.json({ ok: true })
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(error.status || 500).json({ mensaje: 'Ocurrió un error en el servidor.' })
})

// En Vercel la plataforma recibe las peticiones (ver api/index.js); en local escucha en el puerto 3001.
if (!process.env.VERCEL) {
  app.listen(3001, () => {
    console.log('API lista en http://localhost:3001')
  })
}

export default app
