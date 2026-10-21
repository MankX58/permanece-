// Periodos académicos: "2026-1" es de enero a junio y "2026-2" de julio a diciembre. Los usan el servidor y la interfaz.

// Promedio por debajo del cual un estudiante se considera en riesgo de abandonar (prueba académica).
export const UMBRAL_RIESGO = 3

// Con menos estudiantes que esto no se publica la cifra de un grupo, para no señalar a nadie.
export const MINIMO_GRUPO = 3

// Fecha de hoy en Colombia, aunque el servidor corra en otra zona horaria.
export function hoyBogota() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

export function periodoValido(periodo) {
  return /^\d{4}-[12]$/.test(periodo || '')
}

export function periodoDeFecha(fecha) {
  const [anio, mes] = fecha.split('-').map(Number)
  return anio + '-' + (mes <= 6 ? 1 : 2)
}

export function periodoActual() {
  return periodoDeFecha(hoyBogota())
}

export function periodoAnterior(periodo) {
  const [anio, semestre] = periodo.split('-').map(Number)
  return semestre === 2 ? anio + '-1' : anio - 1 + '-2'
}

export function rangoDePeriodo(periodo) {
  const [anio, semestre] = periodo.split('-')
  return semestre === '1' ? [anio + '-01-01', anio + '-06-30'] : [anio + '-07-01', anio + '-12-31']
}

// El actual y los anteriores, del más reciente al más antiguo.
export function ultimosPeriodos(cuantos = 3) {
  const periodos = [periodoActual()]
  while (periodos.length < cuantos) periodos.push(periodoAnterior(periodos[periodos.length - 1]))
  return periodos
}
