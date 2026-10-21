const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export function mesDe(fecha) {
  return meses[Number(fecha.slice(5, 7)) - 1]
}

export function diaDe(fecha) {
  return Number(fecha.slice(8, 10))
}

export function fechaCorta(fecha) {
  return diaDe(fecha) + ' ' + mesDe(fecha).toLowerCase()
}

export function fechaDeHoy() {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return hoy.getFullYear() + '-' + mes + '-' + dia
}

// "jueves, 15 de octubre de 2026"
export function fechaLarga(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function hace(fecha) {
  const hoy = fechaDeHoy().split('-').map(Number)
  const otra = fecha.split('-').map(Number)
  const dias = Math.round(
    (new Date(hoy[0], hoy[1] - 1, hoy[2]) - new Date(otra[0], otra[1] - 1, otra[2])) / 86400000
  )

  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  return 'hace ' + dias + ' días'
}

export function esEsteMes(fecha) {
  return fecha.slice(0, 7) === fechaDeHoy().slice(0, 7)
}

function aHoras(hora) {
  const partes = hora.split(':')
  return Number(partes[0]) + Number(partes[1]) / 60
}

export function horasDe(horario) {
  const partes = horario.split(' - ')
  return aHoras(partes[1]) - aHoras(partes[0])
}

export function promedio(numeros) {
  if (numeros.length === 0) return null
  let suma = 0
  numeros.forEach((numero) => {
    suma += numero
  })
  return (suma / numeros.length).toFixed(1)
}
