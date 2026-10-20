import { carreras } from '../src/data.js'

// Catálogo vigente de materias: el plan oficial de cada carrera (src/data.js) ajustado por la coordinación.
// Cada fila de carrera_materias es un ajuste: quitada = false suma una materia a la carrera;
// quitada = true saca de la carrera una materia del plan oficial (se puede restaurar).

// Error con un mensaje para mostrarle al usuario tal cual (la ruta responde 400).
export class ErrorDeMateria extends Error {}

// Para comparar nombres de materias sin que importen tildes, mayúsculas ni espacios de más.
export function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function nombreLimpio(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim()
}

function validarLargo(nombre) {
  if (nombre.length < 3 || nombre.length > 120) {
    throw new ErrorDeMateria('El nombre de la materia debe tener entre 3 y 120 caracteres.')
  }
}

function planDe(nombreCarrera) {
  return carreras.find((carrera) => carrera.nombre === nombreCarrera).materias
}

// Todos los nombres conocidos (vigentes y del plan oficial), para unificar si alguien escribe uno que ya existe.
function nombresConocidos(vigente) {
  return [...new Set([...vigente.flatMap((c) => c.materias), ...carreras.flatMap((c) => c.materias)])]
}

export function crearMaterias(sql) {
  // La tabla se crea sola la primera vez, por si la base no ha pasado por "npm run db:setup".
  let tabla = null
  function asegurarTabla() {
    tabla ??= (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS carrera_materias (
          carrera TEXT NOT NULL,
          materia TEXT NOT NULL,
          agregada_por TEXT,
          PRIMARY KEY (carrera, materia)
        )
      `
      await sql`ALTER TABLE carrera_materias ADD COLUMN IF NOT EXISTS quitada BOOLEAN NOT NULL DEFAULT false`
      await sql`
        CREATE TABLE IF NOT EXISTS mentor_materias (
          mentor_id TEXT NOT NULL,
          materia TEXT NOT NULL,
          asignada_por TEXT,
          PRIMARY KEY (mentor_id, materia)
        )
      `
    })().catch((error) => {
      tabla = null
      throw error
    })
    return tabla
  }

  // Por carrera: materias vigentes, cuáles se agregaron fuera del plan y cuáles del plan se quitaron.
  async function catalogo() {
    await asegurarTabla()
    const filas = await sql`SELECT carrera, materia, quitada FROM carrera_materias ORDER BY materia`

    return carreras.map((carrera) => {
      const ajustes = filas.filter((fila) => fila.carrera === carrera.nombre)
      const quitadas = ajustes
        .filter((fila) => fila.quitada && carrera.materias.includes(fila.materia))
        .map((fila) => fila.materia)
      const agregadas = ajustes
        .filter((fila) => !fila.quitada && !carrera.materias.includes(fila.materia))
        .map((fila) => fila.materia)

      return {
        nombre: carrera.nombre,
        materias: [...carrera.materias.filter((materia) => !quitadas.includes(materia)), ...agregadas],
        agregadas,
        quitadas,
      }
    })
  }

  async function materiaValida(materia) {
    return (await catalogo()).some((carrera) => carrera.materias.includes(materia))
  }

  // Consultas sin ejecutar (para poder agruparlas en una transacción) que sacan o ponen una materia en una
  // carrera. Para el plan oficial se marca/desmarca "quitada"; para las agregadas se borra/inserta la fila.
  function quitarDe(carrera, materia, quien) {
    return planDe(carrera).includes(materia)
      ? sql`
          INSERT INTO carrera_materias (carrera, materia, agregada_por, quitada)
          VALUES (${carrera}, ${materia}, ${quien}, true)
          ON CONFLICT (carrera, materia) DO UPDATE SET quitada = true, agregada_por = ${quien}
        `
      : sql`DELETE FROM carrera_materias WHERE carrera = ${carrera} AND materia = ${materia}`
  }

  function ponerEn(carrera, materia, quien) {
    return planDe(carrera).includes(materia)
      ? sql`DELETE FROM carrera_materias WHERE carrera = ${carrera} AND materia = ${materia} AND quitada`
      : sql`
          INSERT INTO carrera_materias (carrera, materia, agregada_por, quitada)
          VALUES (${carrera}, ${materia}, ${quien}, false)
          ON CONFLICT (carrera, materia) DO UPDATE SET quitada = false, agregada_por = ${quien}
        `
  }

  // Suma una materia a la carrera: una que ya se ve en otra carrera, una nueva, o una del plan que se había quitado.
  async function agregar(carrera, texto, quien) {
    const nombre = nombreLimpio(texto)
    validarLargo(nombre)

    // Si ya existe se usa su nombre exacto: así es la misma materia en búsquedas y reportes.
    const vigente = await catalogo()
    const existente = nombresConocidos(vigente).find((materia) => normalizar(materia) === normalizar(nombre))
    const materia = existente || nombre

    if (vigente.find((c) => c.nombre === carrera).materias.includes(materia)) {
      throw new ErrorDeMateria(materia + ' ya está en ' + carrera + '.')
    }

    await ponerEn(carrera, materia, quien)
    return { materia, nueva: !existente, restaurada: planDe(carrera).includes(materia) }
  }

  // Saca una materia de la carrera, sea del plan oficial o agregada. Las asesorías y solicitudes que ya tiene
  // no se borran: solo deja de poder elegirse en esta carrera.
  async function quitar(carrera, materia, quien) {
    const vigente = await catalogo()
    if (!vigente.find((c) => c.nombre === carrera).materias.includes(materia)) {
      throw new ErrorDeMateria('Esa materia no está en ' + carrera + '.')
    }
    await quitarDe(carrera, materia, quien)
  }

  // Renombra una materia de la carrera.
  // - Si solo está en esta carrera, el nombre cambia también en las asesorías y solicitudes ya registradas,
  //   para no perder la trazabilidad.
  // - Si es compartida, cambia solo en esta carrera: las otras y el historial conservan el nombre anterior.
  //   Con enTodas (solo admin) cambia en todas las carreras que la tienen y en el historial.
  // - Si el nombre nuevo ya existe, se unifica con esa materia.
  async function renombrar(carrera, materia, texto, quien, enTodas = false) {
    const limpio = nombreLimpio(texto)
    validarLargo(limpio)

    const vigente = await catalogo()
    const actual = vigente.find((c) => c.nombre === carrera)
    if (!actual.materias.includes(materia)) {
      throw new ErrorDeMateria('Esa materia no está en ' + carrera + '.')
    }
    if (limpio === materia) {
      throw new ErrorDeMateria('Escribe un nombre distinto al actual.')
    }

    const nuevo =
      nombresConocidos(vigente)
        .filter((nombre) => nombre !== materia)
        .find((nombre) => normalizar(nombre) === normalizar(limpio)) || limpio

    if (actual.materias.includes(nuevo)) {
      throw new ErrorDeMateria(nuevo + ' ya está en ' + carrera + '. Si son la misma materia, quita una de las dos.')
    }

    const conElla = vigente.filter((c) => c.materias.includes(materia)).map((c) => c.nombre)
    const global = conElla.length === 1 || enTodas
    const afectadas = global ? conElla : [carrera]

    const consultas = []
    afectadas.forEach((nombreCarrera) => {
      consultas.push(quitarDe(nombreCarrera, materia, quien))
      if (!vigente.find((c) => c.nombre === nombreCarrera).materias.includes(nuevo)) {
        consultas.push(ponerEn(nombreCarrera, nuevo, quien))
      }
    })
    if (global) {
      consultas.push(sql`UPDATE asesorias SET materia = ${nuevo} WHERE materia = ${materia}`)
      consultas.push(sql`UPDATE solicitudes SET materia = ${nuevo} WHERE materia = ${materia}`)
      // Los mentores que tenían asignada la materia la siguen teniendo con el nombre nuevo.
      consultas.push(sql`
        INSERT INTO mentor_materias (mentor_id, materia, asignada_por)
        SELECT mentor_id, ${nuevo}, asignada_por FROM mentor_materias WHERE materia = ${materia}
        ON CONFLICT DO NOTHING
      `)
      consultas.push(sql`DELETE FROM mentor_materias WHERE materia = ${materia}`)
    }

    await sql.transaction(consultas)
    return { materia: nuevo, unificada: nuevo !== limpio, historial: global, carreras: afectadas }
  }

  // Cuánto se usa cada materia de la carrera (incluidas las quitadas), para decidir con datos.
  async function uso(carrera) {
    const actual = (await catalogo()).find((c) => c.nombre === carrera)
    const materias = [...actual.materias, ...actual.quitadas]

    const filas = await sql`
      SELECT
        m.materia,
        (SELECT COUNT(*)::int FROM asesorias a WHERE a.materia = m.materia) AS asesorias,
        (SELECT COUNT(*)::int FROM asesorias a WHERE a.materia = m.materia AND a.fecha >= CURRENT_DATE) AS proximas,
        (SELECT COUNT(*)::int FROM solicitudes s WHERE s.materia = m.materia AND s.mentor_id IS NULL) AS pendientes
      FROM unnest(${materias}::text[]) AS m(materia)
    `
    return Object.fromEntries(filas.map((fila) => [fila.materia, fila]))
  }

  // ---------------------------------------------------------- Materias que atiende cada mentor o docente
  // Mentores estudiantes y docentes solo atienden las materias que tienen asignadas (las que dominan o en las
  // que dan clase). Sin materias asignadas no atienden ninguna. El admin no tiene restricción.
  const ROLES_CON_MATERIAS = ['mentor', 'docente']

  // Materias asignadas a un usuario (lista vacía si no tiene).
  async function asignadasA(usuarioId) {
    await asegurarTabla()
    const filas = await sql`SELECT materia FROM mentor_materias WHERE mentor_id = ${usuarioId} ORDER BY materia`
    return filas.map((fila) => fila.materia)
  }

  // null = puede atender cualquier materia (admin); si no, la lista de las que puede atender (puede estar vacía).
  async function alcanceDe(usuario) {
    if (!ROLES_CON_MATERIAS.includes(usuario.rol)) return null
    return asignadasA(usuario.id)
  }

  async function puedeAtender(usuario, materia) {
    const alcance = await alcanceDe(usuario)
    return alcance === null || alcance.includes(materia)
  }

  // Mentores y docentes con sus materias asignadas, para la pantalla de asignación.
  async function mentoresConMaterias() {
    await asegurarTabla()
    return sql`
      SELECT u.id, u.nombre, u.email, u.rol,
        COALESCE(ARRAY_AGG(mm.materia ORDER BY mm.materia) FILTER (WHERE mm.materia IS NOT NULL), '{}'::text[]) AS materias
      FROM usuarios u
      LEFT JOIN mentor_materias mm ON mm.mentor_id = u.id
      WHERE u.rol IN ('mentor', 'docente')
      GROUP BY u.id
      ORDER BY u.nombre
    `
  }

  // carreraPermitida: null para el admin (cualquier materia del catálogo) o la carrera del coordinador.
  async function asignar(mentorId, materia, quien, carreraPermitida = null) {
    const vigente = await catalogo()
    const permitidas = carreraPermitida
      ? vigente.find((c) => c.nombre === carreraPermitida)?.materias || []
      : vigente.flatMap((c) => c.materias)

    if (!permitidas.includes(materia)) {
      throw new ErrorDeMateria(
        carreraPermitida ? 'Solo puedes asignar materias de ' + carreraPermitida + '.' : 'Elige una materia del catálogo.'
      )
    }

    const [mentor] = await sql`SELECT rol FROM usuarios WHERE id = ${mentorId}`
    if (!mentor || !ROLES_CON_MATERIAS.includes(mentor.rol)) {
      throw new ErrorDeMateria('Solo se asignan materias a mentores y docentes.')
    }

    const nuevas = await sql`
      INSERT INTO mentor_materias (mentor_id, materia, asignada_por)
      VALUES (${mentorId}, ${materia}, ${quien})
      ON CONFLICT DO NOTHING
      RETURNING materia
    `
    if (nuevas.length === 0) {
      throw new ErrorDeMateria('Ese mentor ya tiene asignada ' + materia + '.')
    }
  }

  async function desasignar(mentorId, materia, carreraPermitida = null) {
    if (carreraPermitida) {
      const delPrograma = (await catalogo()).find((c) => c.nombre === carreraPermitida)?.materias || []
      if (!delPrograma.includes(materia)) {
        throw new ErrorDeMateria('Solo puedes quitar materias de ' + carreraPermitida + '.')
      }
    }

    await asegurarTabla()
    const borradas = await sql`
      DELETE FROM mentor_materias WHERE mentor_id = ${mentorId} AND materia = ${materia} RETURNING materia
    `
    if (borradas.length === 0) {
      throw new ErrorDeMateria('Ese mentor no tiene asignada esa materia.')
    }
  }

  return {
    catalogo,
    materiaValida,
    agregar,
    quitar,
    renombrar,
    uso,
    asignadasA,
    alcanceDe,
    puedeAtender,
    mentoresConMaterias,
    asignar,
    desasignar,
  }
}
