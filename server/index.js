import express from 'express'
import { auth } from 'express-oauth2-jwt-bearer'
import { neon } from '@neondatabase/serverless'
import { areas, carreras } from '../src/data.js'
import { construirReporte, generarExcel } from './reportes.js'

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

// Catálogo vigente: el plan oficial de cada carrera más las materias que le agregaron los coordinadores.
// "agregadas" dice cuáles no vienen del plan, para mostrarlas distinto y poder quitarlas.
async function catalogo() {
  const filas = await sql`SELECT carrera, materia FROM carrera_materias ORDER BY materia`

  return carreras.map((carrera) => {
    const agregadas = filas.filter((fila) => fila.carrera === carrera.nombre).map((fila) => fila.materia)
    return {
      nombre: carrera.nombre,
      materias: [...carrera.materias, ...agregadas],
      agregadas,
    }
  })
}

async function materiaValida(materia) {
  return (await catalogo()).some((carrera) => carrera.materias.includes(materia))
}

// Para comparar nombres de materias sin que importen tildes, mayúsculas ni espacios de más.
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

async function notificar(usuario, texto) {
  if (usuario) {
    await sql`INSERT INTO notificaciones (usuario_id, texto) VALUES (${usuario}, ${texto})`
  }
}

function perfilTutor(req) {
  const esDocente = req.usuario.rol === 'docente'
  return {
    rol: esDocente ? 'Docente Titular' : 'Mentor Voluntario',
    tipo: esDocente ? 'Docente' : 'Voluntario',
  }
}

// Normaliza los datos de una sesión: virtual no lleva lugar físico y presencial no lleva enlace.
function datosSesion(s) {
  const virtual = s.virtual === true
  return {
    fecha: s.fecha,
    horario: s.horario,
    virtual,
    lugar: virtual ? 'Virtual' : String(s.lugar || '').trim(),
    enlace: virtual && s.enlace ? String(s.enlace).trim() : null,
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

function fechaLegible(fecha) {
  return fecha.split('-').reverse().join('/')
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

  const [asesorias, solicitudes, notificaciones, usuarios, materias] = await Promise.all([
    buscarAsesorias(yo.id),
    buscarSolicitudes(yo.id, esMentor),
    buscarNotificaciones(yo.id),
    esAdmin ? buscarUsuarios() : [],
    catalogo(),
  ])

  res.json({ yo, asesorias, solicitudes, notificaciones, usuarios, catalogo: materias })
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

// Suma una materia a la carrera: una que ya se ve en otra carrera o una nueva.
app.post('/api/materias', soloCoordinacion, async (req, res) => {
  const carrera = String(req.body.carrera || '')
  const nombre = String(req.body.materia || '').replace(/\s+/g, ' ').trim()

  const error = errorDeCarrera(req, carrera)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }
  if (nombre.length < 3 || nombre.length > 120) {
    return res.status(400).json({ mensaje: 'El nombre de la materia debe tener entre 3 y 120 caracteres.' })
  }

  // Si ya existe en alguna carrera se usa su nombre exacto: así es la misma materia en búsquedas y reportes.
  const vigente = await catalogo()
  const existente = vigente.flatMap((c) => c.materias).find((materia) => normalizar(materia) === normalizar(nombre))
  const materia = existente || nombre

  if (vigente.find((c) => c.nombre === carrera).materias.includes(materia)) {
    return res.status(400).json({ mensaje: materia + ' ya está en ' + carrera + '.' })
  }

  await sql`
    INSERT INTO carrera_materias (carrera, materia, agregada_por)
    VALUES (${carrera}, ${materia}, ${idUsuario(req)})
    ON CONFLICT DO NOTHING
  `
  res.json({ materia, nueva: !existente })
})

// Quita una materia agregada. Las del plan oficial no se pueden quitar desde aquí.
app.delete('/api/materias', soloCoordinacion, async (req, res) => {
  const carrera = String(req.body.carrera || '')
  const materia = String(req.body.materia || '')

  const error = errorDeCarrera(req, carrera)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }

  const borradas = await sql`
    DELETE FROM carrera_materias WHERE carrera = ${carrera} AND materia = ${materia}
    RETURNING materia
  `
  if (borradas.length === 0) {
    return res.status(400).json({ mensaje: 'Solo puedes quitar materias que se agregaron a la carrera.' })
  }
  res.json({ ok: true })
})

app.post('/api/asesorias', soloMentores, async (req, res) => {
  const a = req.body

  if (!(await materiaValida(a.materia))) {
    return res.status(400).json({ mensaje: 'Elige una materia de la lista.' })
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

app.post('/api/solicitudes', async (req, res) => {
  const s = req.body

  if (!(await materiaValida(s.materia))) {
    return res.status(400).json({ mensaje: 'Elige una materia de la lista.' })
  }

  await sql`
    INSERT INTO solicitudes (usuario_id, estudiante, materia, tema, urgencia)
    VALUES (${idUsuario(req)}, ${req.usuario.nombre}, ${s.materia}, ${s.tema}, ${s.urgencia})
  `

  // Los mentores y docentes se enteran de que hay una solicitud nueva.
  await sql`
    INSERT INTO notificaciones (usuario_id, texto)
    SELECT id, ${'Nueva solicitud de ' + s.materia + ' (' + s.urgencia.toLowerCase() + ').'}::text
    FROM usuarios
    WHERE rol IN ('mentor', 'docente', 'admin') AND id <> ${idUsuario(req)}
  `
  res.json({ ok: true })
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

app.post('/api/solicitudes/:id/aceptar', soloMentores, async (req, res) => {
  const usuario = idUsuario(req)
  const [solicitud] = await sql`
    UPDATE solicitudes
    SET mentor_id = ${usuario}
    WHERE id = ${req.params.id} AND mentor_id IS NULL AND usuario_id IS DISTINCT FROM ${usuario}
    RETURNING usuario_id, materia
  `

  if (!solicitud) {
    return res.status(400).json({ mensaje: 'Esa solicitud ya no está disponible.' })
  }

  await notificar(solicitud.usuario_id, req.usuario.nombre + ' aceptó tu solicitud de ' + solicitud.materia + '.')
  res.json({ ok: true })
})

app.post('/api/solicitudes/:id/liberar', soloMentores, async (req, res) => {
  const [solicitud] = await sql`
    UPDATE solicitudes
    SET mentor_id = NULL
    WHERE id = ${req.params.id} AND mentor_id = ${idUsuario(req)} AND atendida_en IS NULL AND asesoria_id IS NULL
    RETURNING usuario_id, materia
  `
  if (solicitud) {
    await notificar(solicitud.usuario_id, 'Tu solicitud de ' + solicitud.materia + ' volvió a quedar pendiente.')
  }
  res.json({ ok: true })
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

// Agendar una solicitud aceptada: crea una sesión individual (asesoría privada de un cupo) para el estudiante.
app.post('/api/solicitudes/:id/agendar', soloMentores, async (req, res) => {
  const [solicitud] = await sql`
    SELECT usuario_id, materia, tema FROM solicitudes
    WHERE id = ${req.params.id} AND mentor_id = ${idUsuario(req)} AND asesoria_id IS NULL AND atendida_en IS NULL
  `

  if (!solicitud) {
    return res.status(400).json({ mensaje: 'Esa solicitud no está en tu lista por agendar.' })
  }
  if (!solicitud.usuario_id) {
    return res.status(400).json({ mensaje: 'Esta solicitud no tiene un estudiante registrado para agendar.' })
  }
  if (!areas.includes(req.body.area)) {
    return res.status(400).json({ mensaje: 'Elige el área de la asesoría.' })
  }

  const sesion = datosSesion(req.body)
  const error = await errorDeSesion(sesion)
  if (error) {
    return res.status(400).json({ mensaje: error })
  }

  const { rol, tipo } = perfilTutor(req)

  await sql`
    WITH nueva AS (
      INSERT INTO asesorias (tutor_id, tutor, rol, tipo, area, materia, descripcion, fecha, horario, lugar, virtual, enlace, cupos, privada)
      VALUES (${idUsuario(req)}, ${req.usuario.nombre}, ${rol}, ${tipo}, ${req.body.area}, ${solicitud.materia}, ${solicitud.tema}, ${sesion.fecha}, ${sesion.horario}, ${sesion.lugar}, ${sesion.virtual}, ${sesion.enlace}, 1, true)
      RETURNING id
    ), inscrito AS (
      INSERT INTO inscripciones (usuario_id, asesoria_id)
      SELECT ${solicitud.usuario_id}::text, id FROM nueva
    )
    UPDATE solicitudes SET asesoria_id = (SELECT id FROM nueva) WHERE id = ${req.params.id}
  `

  const donde = sesion.virtual
    ? sesion.enlace
      ? 'virtual (enlace en tu portal)'
      : 'virtual (el mentor compartirá el enlace)'
    : 'en ' + sesion.lugar
  await notificar(
    solicitud.usuario_id,
    req.usuario.nombre + ' agendó tu asesoría de ' + solicitud.materia + ': ' +
      fechaLegible(sesion.fecha) + ', ' + sesion.horario + ', ' + donde + '.'
  )
  res.json({ ok: true })
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
