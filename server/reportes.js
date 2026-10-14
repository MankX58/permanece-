import ExcelJS from 'exceljs'
import { carreras as planOficial } from '../src/data.js'
import { horasDe } from '../src/fechas.js'

// Programas donde se cursa cada materia (una materia compartida cuenta en cada uno).
function mapaDeProgramas(carreras) {
  const programasDe = new Map()
  carreras.forEach((carrera) => {
    carrera.materias.forEach((materia) => {
      if (!programasDe.has(materia)) programasDe.set(materia, [])
      programasDe.get(materia).push(carrera.nombre)
    })
  })
  return programasDe
}

function filaVacia(materia, programas = []) {
  return {
    materia,
    programas,
    realizadas: 0,
    programadas: 0,
    individuales: 0,
    grupales: 0,
    inscritos: 0,
    asistieron: 0,
    noAsistieron: 0,
    sinRegistrar: 0,
    horas: 0,
    resenas: 0,
    sumaValoracion: 0,
    solicitudes: 0,
    aceptadas: 0,
    estudiantes: new Set(),
  }
}

function calcular(fila) {
  const registrados = fila.asistieron + fila.noAsistieron
  return {
    ...fila,
    estudiantes: undefined,
    estudiantesUnicos: fila.estudiantes.size,
    tasaAsistencia: registrados > 0 ? fila.asistieron / registrados : null,
    valoracion: fila.resenas > 0 ? fila.sumaValoracion / fila.resenas : null,
    horas: Math.round(fila.horas * 10) / 10,
  }
}

function sumar(filas) {
  const total = filaVacia('Total')
  filas.forEach((fila) => {
    ;['realizadas', 'programadas', 'individuales', 'grupales', 'inscritos', 'asistieron', 'noAsistieron',
      'sinRegistrar', 'horas', 'resenas', 'sumaValoracion', 'solicitudes', 'aceptadas'].forEach((campo) => {
      total[campo] += fila[campo]
    })
    fila.estudiantes.forEach((id) => total.estudiantes.add(id))
  })
  return total
}

// Cuenta asesorías, asistencia, valoración y demanda por materia dentro de un rango de fechas.
// programa: nombre de una carrera del catálogo, o null para todo. desde/hasta: 'YYYY-MM-DD' o null.
// carreras: el catálogo vigente (plan oficial más las materias que agregaron los coordinadores).
export async function construirReporte(sql, { desde = null, hasta = null, programa = null, carreras = planOficial }) {
  const programasDe = mapaDeProgramas(carreras)
  const vacia = (materia) => filaVacia(materia, programasDe.get(materia) || [])

  const sesiones = await sql`
    SELECT
      a.id, a.materia, to_char(a.fecha, 'YYYY-MM-DD') AS fecha, a.horario, a.privada, a.virtual, a.cupos, a.tutor,
      a.fecha < CURRENT_DATE AS pasada,
      a.resumen IS NOT NULL AS "conResumen",
      COUNT(i.usuario_id)::int AS inscritos,
      COUNT(*) FILTER (WHERE i.asistio IS TRUE)::int AS asistieron,
      COUNT(*) FILTER (WHERE i.asistio IS FALSE)::int AS "noAsistieron",
      COUNT(i.valoracion)::int AS resenas,
      COALESCE(SUM(i.valoracion), 0)::int AS "sumaValoracion",
      COALESCE(ARRAY_AGG(i.usuario_id) FILTER (WHERE i.usuario_id IS NOT NULL), '{}'::text[]) AS estudiantes
    FROM asesorias a
    LEFT JOIN inscripciones i ON i.asesoria_id = a.id
    WHERE (${desde}::date IS NULL OR a.fecha >= ${desde}::date)
      AND (${hasta}::date IS NULL OR a.fecha <= ${hasta}::date)
    GROUP BY a.id
    ORDER BY a.fecha, a.horario
  `

  const solicitudes = await sql`
    SELECT materia, COUNT(*)::int AS total, COUNT(*) FILTER (WHERE mentor_id IS NOT NULL)::int AS aceptadas
    FROM solicitudes
    WHERE (${desde}::date IS NULL OR (creada_en AT TIME ZONE 'America/Bogota')::date >= ${desde}::date)
      AND (${hasta}::date IS NULL OR (creada_en AT TIME ZONE 'America/Bogota')::date <= ${hasta}::date)
    GROUP BY materia
  `

  const porMateria = new Map()
  const fila = (materia) => {
    if (!porMateria.has(materia)) porMateria.set(materia, vacia(materia))
    return porMateria.get(materia)
  }

  sesiones.forEach((s) => {
    const f = fila(s.materia)

    if (!s.pasada) {
      f.programadas += 1
      return
    }

    f.realizadas += 1
    f[s.privada ? 'individuales' : 'grupales'] += 1
    f.inscritos += s.inscritos
    f.asistieron += s.asistieron
    f.noAsistieron += s.noAsistieron
    f.sinRegistrar += s.inscritos - s.asistieron - s.noAsistieron
    f.horas += horasDe(s.horario)
    f.resenas += s.resenas
    f.sumaValoracion += s.sumaValoracion
    s.estudiantes.forEach((id) => f.estudiantes.add(id))
  })

  solicitudes.forEach((s) => {
    const f = fila(s.materia)
    f.solicitudes += s.total
    f.aceptadas += s.aceptadas
  })

  let universo
  if (programa) {
    const materias = carreras.find((carrera) => carrera.nombre === programa).materias
    universo = materias.map((materia) => porMateria.get(materia) || vacia(materia))
  } else {
    universo = [...porMateria.values()]
  }

  const orden = (a, b) => b.realizadas - a.realizadas || b.inscritos - a.inscritos || a.materia.localeCompare(b.materia, 'es')
  universo.sort(orden)

  const enUniverso = new Set(universo.map((f) => f.materia))
  const sesionesVisibles = sesiones
    .filter((s) => enUniverso.has(s.materia))
    .map(({ estudiantes, ...resto }) => resto)

  // Resumen por programa (solo cuando no se filtró uno): una materia compartida suma en cada programa.
  let programas = null
  if (!programa) {
    programas = carreras.map((carrera) => {
      const activas = carrera.materias
        .map((materia) => porMateria.get(materia))
        .filter((f) => f && f.realizadas + f.programadas + f.solicitudes > 0)
      const suma = sumar(activas)
      const calculada = calcular(suma)
      return {
        programa: carrera.nombre,
        materiasConActividad: activas.length,
        totalMaterias: carrera.materias.length,
        ...calculada,
        materia: undefined,
      }
    })
  }

  const filas = universo.map(calcular)
  const totales = calcular(sumar(universo))

  return {
    rango: { desde, hasta },
    programa,
    filas,
    totales,
    programas,
    sesiones: sesionesVisibles,
  }
}

// ---------------------------------------------------------------- Excel

const ROJO = 'FFB91C1C'
const ROJO_SUAVE = 'FFFEE2E2'
const GRIS = 'FFF4F4F5'
const BORDE = { style: 'thin', color: { argb: 'FFE4E4E7' } }
const BORDES = { top: BORDE, left: BORDE, bottom: BORDE, right: BORDE }

function fechaLegible(fecha) {
  return fecha ? fecha.split('-').reverse().join('/') : null
}

function estiloEncabezado(hoja, numeroFila) {
  const fila = hoja.getRow(numeroFila)
  fila.height = 30
  fila.eachCell((celda) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO } }
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    celda.border = BORDES
  })
}

function estiloCuerpo(hoja, primera, ultima) {
  for (let n = primera; n <= ultima; n += 1) {
    hoja.getRow(n).eachCell((celda) => {
      celda.border = BORDES
      celda.alignment = { vertical: 'middle', horizontal: celda.alignment?.horizontal, wrapText: true }
      if ((n - primera) % 2 === 1) {
        celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRIS } }
      }
    })
  }
}

function estiloTotal(fila) {
  fila.eachCell((celda) => {
    celda.font = { bold: true }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ROJO_SUAVE } }
    celda.border = BORDES
  })
}

function colorPorcentaje(hoja, referencia) {
  hoja.addConditionalFormatting({
    ref: referencia,
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThanOrEqual',
        priority: 1,
        formulae: [0.8],
        style: { font: { bold: true, color: { argb: 'FF047857' } } },
      },
      {
        type: 'cellIs',
        operator: 'lessThan',
        priority: 2,
        formulae: [0.5],
        style: { font: { bold: true, color: { argb: ROJO } } },
      },
    ],
  })
}

const COLUMNAS_MATERIA = [
  { encabezado: 'Materia', clave: 'materia', ancho: 44 },
  { encabezado: 'Programas', clave: 'programas', ancho: 36 },
  { encabezado: 'Asesorías realizadas', clave: 'realizadas', ancho: 14, centro: true },
  { encabezado: 'Programadas (próximas)', clave: 'programadas', ancho: 14, centro: true },
  { encabezado: 'Individuales', clave: 'individuales', ancho: 12, centro: true },
  { encabezado: 'Grupales', clave: 'grupales', ancho: 12, centro: true },
  { encabezado: 'Inscripciones', clave: 'inscritos', ancho: 13, centro: true },
  { encabezado: 'Asistieron', clave: 'asistieron', ancho: 12, centro: true },
  { encabezado: 'No asistieron', clave: 'noAsistieron', ancho: 13, centro: true },
  { encabezado: 'Sin registrar', clave: 'sinRegistrar', ancho: 13, centro: true },
  { encabezado: '% asistencia (sobre registrados)', clave: 'tasaAsistencia', ancho: 17, centro: true, formato: '0%' },
  { encabezado: 'Estudiantes únicos', clave: 'estudiantesUnicos', ancho: 13, centro: true },
  { encabezado: 'Horas impartidas', clave: 'horas', ancho: 12, centro: true, formato: '0.0' },
  { encabezado: 'Valoración promedio', clave: 'valoracion', ancho: 13, centro: true, formato: '0.0' },
  { encabezado: 'Reseñas', clave: 'resenas', ancho: 10, centro: true },
  { encabezado: 'Solicitudes recibidas', clave: 'solicitudes', ancho: 13, centro: true },
  { encabezado: 'Solicitudes aceptadas', clave: 'aceptadas', ancho: 13, centro: true },
]

function valorDe(fila, columna) {
  const valor = fila[columna.clave]
  if (Array.isArray(valor)) return valor.length > 0 ? valor.join(', ') : 'Sin catalogar'
  return valor ?? null
}

function agregarTabla(hoja, columnas, filas, totales, filaInicial) {
  columnas.forEach((columna, indice) => {
    hoja.getColumn(indice + 1).width = columna.ancho
    hoja.getRow(filaInicial).getCell(indice + 1).value = columna.encabezado
  })
  estiloEncabezado(hoja, filaInicial)

  filas.forEach((fila, posicion) => {
    const fil = hoja.getRow(filaInicial + 1 + posicion)
    columnas.forEach((columna, indice) => {
      const celda = fil.getCell(indice + 1)
      celda.value = valorDe(fila, columna)
      if (columna.formato) celda.numFmt = columna.formato
      if (columna.centro) celda.alignment = { horizontal: 'center' }
    })
  })

  const ultimaDatos = filaInicial + filas.length
  estiloCuerpo(hoja, filaInicial + 1, ultimaDatos)

  if (totales) {
    const filaTotal = hoja.getRow(ultimaDatos + 1)
    columnas.forEach((columna, indice) => {
      const celda = filaTotal.getCell(indice + 1)
      celda.value = indice === 0 ? 'TOTAL' : columna.clave === 'programas' ? null : valorDe(totales, columna)
      if (columna.formato) celda.numFmt = columna.formato
      if (columna.centro) celda.alignment = { horizontal: 'center' }
    })
    estiloTotal(filaTotal)
  }

  hoja.views = [{ state: 'frozen', ySplit: filaInicial, xSplit: 1 }]
  hoja.autoFilter = {
    from: { row: filaInicial, column: 1 },
    to: { row: ultimaDatos, column: columnas.length },
  }
  return ultimaDatos
}

export async function generarExcel(reporte, { generadoPor, rol }) {
  const libro = new ExcelJS.Workbook()
  libro.creator = 'PERMANECE+'
  libro.created = new Date()

  const { rango, programa, filas, totales, programas, sesiones } = reporte

  // ---- Resumen
  const resumen = libro.addWorksheet('Resumen', { properties: { tabColor: { argb: ROJO } } })
  resumen.getColumn(1).width = 44
  resumen.getColumn(2).width = 24
  resumen.getColumn(3).width = 60

  resumen.mergeCells('A1:C1')
  resumen.getCell('A1').value = 'PERMANECE+ · Informe de asesorías'
  resumen.getCell('A1').font = { bold: true, size: 18, color: { argb: ROJO } }
  resumen.getRow(1).height = 32

  const periodo =
    rango.desde || rango.hasta
      ? (fechaLegible(rango.desde) || 'inicio') + ' al ' + (fechaLegible(rango.hasta) || 'hoy')
      : 'Todo el histórico'
  const encabezados = [
    ['Programa', programa || 'Todos los programas'],
    ['Periodo', periodo],
    ['Generado', new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })],
    ['Generado por', generadoPor + ' (' + rol + ')'],
  ]
  encabezados.forEach(([etiqueta, valor], i) => {
    const n = 3 + i
    resumen.getCell('A' + n).value = etiqueta
    resumen.getCell('A' + n).font = { bold: true, color: { argb: 'FF52525B' } }
    resumen.getCell('B' + n).value = valor
    resumen.mergeCells('B' + n + ':C' + n)
  })

  const inicioIndicadores = 8
  resumen.getRow(inicioIndicadores).getCell(1).value = 'Indicador'
  resumen.getRow(inicioIndicadores).getCell(2).value = 'Valor'
  resumen.getRow(inicioIndicadores).getCell(3).value = 'Cómo se calcula'
  estiloEncabezado(resumen, inicioIndicadores)

  const indicadores = [
    ['Asesorías realizadas', totales.realizadas, '0', 'Sesiones cuya fecha ya pasó dentro del periodo.'],
    ['Asesorías programadas (próximas)', totales.programadas, '0', 'Sesiones con fecha de hoy en adelante dentro del periodo.'],
    ['   Individuales', totales.individuales, '0', 'Realizadas que nacieron de una solicitud agendada (1 estudiante).'],
    ['   Grupales', totales.grupales, '0', 'Realizadas publicadas en el banco.'],
    ['Inscripciones', totales.inscritos, '0', 'Estudiantes inscritos en las sesiones realizadas.'],
    ['   Asistieron', totales.asistieron, '0', 'Asistencia confirmada por el mentor.'],
    ['   No asistieron', totales.noAsistieron, '0', 'Inasistencia confirmada por el mentor.'],
    ['   Sin registrar', totales.sinRegistrar, '0', 'Inscritos cuya asistencia el mentor aún no registra.'],
    ['% de asistencia', totales.tasaAsistencia, '0%', 'Asistieron ÷ (Asistieron + No asistieron). No incluye "Sin registrar".'],
    ['Estudiantes únicos atendidos', totales.estudiantesUnicos, '0', 'Estudiantes distintos con al menos una inscripción realizada.'],
    ['Horas impartidas', totales.horas, '0.0', 'Suma de la duración de las sesiones realizadas.'],
    ['Valoración promedio (1 a 5)', totales.valoracion, '0.0', 'Promedio de las valoraciones que dejaron los estudiantes.'],
    ['Reseñas recibidas', totales.resenas, '0', 'Valoraciones registradas.'],
    ['Solicitudes recibidas', totales.solicitudes, '0', 'Solicitudes de asesoría creadas en el periodo (demanda).'],
    ['Solicitudes aceptadas', totales.aceptadas, '0', 'De las anteriores, las que un mentor ya aceptó.'],
  ]
  indicadores.forEach(([etiqueta, valor, formato, nota], i) => {
    const fila = resumen.getRow(inicioIndicadores + 1 + i)
    fila.getCell(1).value = etiqueta
    fila.getCell(2).value = valor
    fila.getCell(2).numFmt = formato
    fila.getCell(2).alignment = { horizontal: 'center' }
    fila.getCell(2).font = { bold: true }
    fila.getCell(3).value = nota
    fila.getCell(3).font = { color: { argb: 'FF71717A' }, size: 10 }
  })
  estiloCuerpo(resumen, inicioIndicadores + 1, inicioIndicadores + indicadores.length)

  const notas = inicioIndicadores + indicadores.length + 2
  resumen.mergeCells('A' + notas + ':C' + (notas + 2))
  resumen.getCell('A' + notas).value =
    'Nota: una materia compartida por varios programas se cuenta en cada uno de ellos. Este informe contiene datos ' +
    'agregados; no incluye nombres de estudiantes.'
  resumen.getCell('A' + notas).alignment = { wrapText: true, vertical: 'top' }
  resumen.getCell('A' + notas).font = { italic: true, color: { argb: 'FF71717A' }, size: 10 }

  // ---- Por materia
  const hojaMaterias = libro.addWorksheet('Por materia', { properties: { tabColor: { argb: ROJO } } })
  const ultimaMateria = agregarTabla(hojaMaterias, COLUMNAS_MATERIA, filas, totales, 1)
  colorPorcentaje(hojaMaterias, 'K2:K' + Math.max(2, ultimaMateria))

  // ---- Por programa (solo vista general)
  if (programas) {
    const hojaProgramas = libro.addWorksheet('Por programa', { properties: { tabColor: { argb: ROJO } } })
    const columnas = [
      { encabezado: 'Programa', clave: 'programa', ancho: 40 },
      { encabezado: 'Materias con actividad', clave: 'materiasConActividad', ancho: 13, centro: true },
      { encabezado: 'Materias del plan', clave: 'totalMaterias', ancho: 13, centro: true },
      ...COLUMNAS_MATERIA.slice(2).filter((c) => c.clave !== 'programadas'),
    ]
    const ultimo = agregarTabla(hojaProgramas, columnas, programas, null, 1)
    const posicionPorcentaje = columnas.findIndex((c) => c.clave === 'tasaAsistencia') + 1
    const letra = String.fromCharCode(64 + posicionPorcentaje)
    colorPorcentaje(hojaProgramas, letra + '2:' + letra + Math.max(2, ultimo))
  }

  // ---- Sesiones
  const hojaSesiones = libro.addWorksheet('Sesiones', { properties: { tabColor: { argb: ROJO } } })
  const columnasSesion = [
    { encabezado: 'Fecha', clave: 'fecha', ancho: 13, centro: true },
    { encabezado: 'Horario', clave: 'horario', ancho: 16, centro: true },
    { encabezado: 'Materia', clave: 'materia', ancho: 44 },
    { encabezado: 'Mentor / docente', clave: 'tutor', ancho: 28 },
    { encabezado: 'Tipo', clave: 'tipo', ancho: 12, centro: true },
    { encabezado: 'Modalidad', clave: 'modalidad', ancho: 13, centro: true },
    { encabezado: 'Estado', clave: 'estado', ancho: 13, centro: true },
    { encabezado: 'Cupos', clave: 'cupos', ancho: 9, centro: true },
    { encabezado: 'Inscritos', clave: 'inscritos', ancho: 10, centro: true },
    { encabezado: 'Asistieron', clave: 'asistieron', ancho: 11, centro: true },
    { encabezado: 'Valoración', clave: 'valoracion', ancho: 11, centro: true, formato: '0.0' },
    { encabezado: 'Retroalimentación', clave: 'retro', ancho: 16, centro: true },
  ]
  const filasSesion = sesiones.map((s) => ({
    ...s,
    fecha: fechaLegible(s.fecha),
    tipo: s.privada ? 'Individual' : 'Grupal',
    modalidad: s.virtual ? 'Virtual' : 'Presencial',
    estado: s.pasada ? 'Realizada' : 'Programada',
    valoracion: s.resenas > 0 ? s.sumaValoracion / s.resenas : null,
    retro: s.pasada ? (s.conResumen ? 'Sí' : 'Pendiente') : null,
  }))
  agregarTabla(hojaSesiones, columnasSesion, filasSesion, null, 1)

  const buffer = await libro.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
