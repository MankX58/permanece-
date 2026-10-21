import { UMBRAL_RIESGO, MINIMO_GRUPO, rangoDePeriodo, periodoAnterior } from '../src/periodos.js'

const media = (valores) => valores.reduce((a, b) => a + b, 0) / valores.length
const redondear = (numero, decimales) => Math.round(numero * 10 ** decimales) / 10 ** decimales + 0

// Cifras de un grupo de estudiantes. Con menos de MINIMO_GRUPO personas la cifra no se publica (null).
function resumen(filas) {
  const conActual = filas.filter((f) => f.actual !== null)
  const conAmbos = conActual.filter((f) => f.anterior !== null)
  const estaban = conAmbos.filter((f) => f.anterior < UMBRAL_RIESGO)
  const si = (n, valor) => (n >= MINIMO_GRUPO ? valor : null)

  return {
    estudiantes: filas.length,
    conPromedio: conActual.length,
    promedio: si(conActual.length, redondear(media(conActual.map((f) => f.actual)), 2)),
    conCambio: conAmbos.length,
    cambio: si(conAmbos.length, redondear(media(conAmbos.map((f) => f.actual - f.anterior)), 2)),
    pctEnRiesgo: si(
      conActual.length,
      redondear(conActual.filter((f) => f.actual < UMBRAL_RIESGO).length / conActual.length, 3)
    ),
    estabanEnRiesgo: si(estaban.length, estaban.length),
    pctSalieron: si(estaban.length, redondear(estaban.filter((f) => f.actual >= UMBRAL_RIESGO).length / estaban.length, 3)),
  }
}

// filas: una por estudiante con { atendido, actual, anterior } (promedios null si no los registró).
export function calcularImpacto(filas) {
  return {
    atendidos: resumen(filas.filter((f) => f.atendido)),
    noAtendidos: resumen(filas.filter((f) => !f.atendido)),
    total: resumen(filas),
  }
}

// Compara, dentro de un programa (o de todos si es null), a quienes recibieron asesorías en el periodo con quienes no.
// Atendido: se inscribió a una asesoría ya realizada de ese periodo y el mentor no lo marcó como ausente.
export async function construirImpacto(sql, { programa = null, periodo }) {
  const anterior = periodoAnterior(periodo)
  const [desde, hasta] = rangoDePeriodo(periodo)

  const filas = await sql`
    SELECT
      p.promedio::float8 AS actual,
      q.promedio::float8 AS anterior,
      EXISTS (
        SELECT 1 FROM inscripciones i
        JOIN asesorias a ON a.id = i.asesoria_id
        WHERE i.usuario_id = u.id
          AND a.fecha BETWEEN ${desde}::date AND ${hasta}::date
          AND a.fecha < CURRENT_DATE
          AND i.asistio IS DISTINCT FROM false
      ) AS atendido
    FROM usuarios u
    LEFT JOIN promedios p ON p.usuario_id = u.id AND p.periodo = ${periodo}
    LEFT JOIN promedios q ON q.usuario_id = u.id AND q.periodo = ${anterior}
    WHERE u.rol IN ('estudiante', 'mentor') AND u.carrera IS NOT NULL
      AND (${programa}::text IS NULL OR u.carrera = ${programa})
  `

  return {
    periodo,
    anterior,
    programa,
    umbral: UMBRAL_RIESGO,
    minimoGrupo: MINIMO_GRUPO,
    actualizado: new Date().toISOString(),
    ...calcularImpacto(filas),
  }
}
