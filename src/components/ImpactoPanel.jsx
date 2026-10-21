import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ultimosPeriodos } from '../periodos.js'

const porcentaje = (valor) => (valor === null || valor === undefined ? '—' : Math.round(valor * 100) + '%')
const promedio = (valor) => (valor === null || valor === undefined ? '—' : valor.toFixed(2))
const cambio = (valor) => (valor === null || valor === undefined ? '—' : (valor > 0 ? '+' : '') + valor.toFixed(2))

function lectura(d) {
  const { atendidos: a, noAtendidos: n } = d
  if (a.cambio === null || n.cambio === null) return null
  let texto =
    'Los estudiantes atendidos cambiaron su promedio ' + cambio(a.cambio) + ' frente a ' + cambio(n.cambio) +
    ' de quienes no recibieron asesorías.'
  if (a.pctEnRiesgo !== null && n.pctEnRiesgo !== null) {
    texto += ' En riesgo de deserción hay ' + porcentaje(a.pctEnRiesgo) + ' de los atendidos y ' + porcentaje(n.pctEnRiesgo) + ' de los demás.'
  }
  return texto
}

// Panel de impacto para el coordinador: compara el promedio y el riesgo de deserción de quienes recibieron
// asesorías con quienes no, y se actualiza solo mientras está abierto.
function ImpactoPanel({ api, programa }) {
  const periodos = ultimosPeriodos(3)
  const [periodo, setPeriodo] = useState(periodos[0])
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vigente = true

    async function cargar() {
      try {
        const parametros = new URLSearchParams({ periodo })
        if (programa) parametros.set('programa', programa)
        const respuesta = await api('/impacto?' + parametros)
        if (vigente) {
          setDatos(respuesta)
          setError(null)
        }
      } catch (e) {
        if (vigente) setError(e.message)
      }
    }

    setDatos(null)
    cargar()
    const intervalo = setInterval(() => !document.hidden && cargar(), 15000)
    window.addEventListener('focus', cargar)
    return () => {
      vigente = false
      clearInterval(intervalo)
      window.removeEventListener('focus', cargar)
    }
  }, [periodo, programa])

  const a = datos?.atendidos
  const n = datos?.noAtendidos
  const total = datos?.total

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Impacto en el rendimiento y la permanencia</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Compara a los estudiantes que recibieron asesorías con los que no. El promedio lo registra cada estudiante.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {datos && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="size-2 rounded-full bg-emerald-400"
              />
              En vivo · {new Date(datos.actualizado).toLocaleTimeString('es-CO')}
            </span>
          )}
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-tarjeta border border-borde rounded-lg px-3 py-1.5 text-sm outline-none focus:border-acento"
          >
            {periodos.map((opcion, i) => (
              <option key={opcion} value={opcion}>
                {opcion + (i === 0 ? ' (actual)' : '')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-acento bg-primario/10 border border-primario/30 rounded-xl p-4 mt-4">{error}</p>}
      {!datos && !error && <p className="text-sm text-zinc-400 mt-4">Calculando...</p>}

      {datos && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-tarjeta rounded-2xl mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left">
              <thead className="text-xs text-zinc-400 border-b border-borde">
                <tr>
                  <th className="py-3 pl-5 pr-3 font-semibold">Indicador</th>
                  <th className="py-3 px-3 font-semibold text-right w-28">Atendidos</th>
                  <th className="py-3 pl-3 pr-5 font-semibold text-right w-28">No atendidos</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Promedio', 'Periodo ' + datos.periodo + ' · ' + a.conPromedio + ' y ' + n.conPromedio + ' con promedio registrado', promedio(a.promedio), promedio(n.promedio)],
                  ['Cambio del promedio', 'Frente a ' + datos.anterior + ' · ' + a.conCambio + ' y ' + n.conCambio + ' comparables', cambio(a.cambio), cambio(n.cambio)],
                  ['En riesgo de deserción', 'Con promedio menor a ' + datos.umbral.toFixed(1), porcentaje(a.pctEnRiesgo), porcentaje(n.pctEnRiesgo)],
                  ['Salieron del riesgo', 'De quienes estaban en riesgo el periodo anterior', porcentaje(a.pctSalieron), porcentaje(n.pctSalieron)],
                ].map(([nombre, detalle, conAsesoria, sinAsesoria]) => (
                  <tr key={nombre} className="border-b border-borde last:border-0">
                    <td className="py-3 pl-5 pr-3">
                      <p className="text-sm">{nombre}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{detalle}</p>
                    </td>
                    <td className="py-3 px-3 text-right text-lg font-semibold tabular-nums">{conAsesoria}</td>
                    <td className="py-3 pl-3 pr-5 text-right text-lg tabular-nums text-zinc-400">{sinAsesoria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lectura(datos) ? (
            <div className="mt-4">
              <p className="text-sm text-zinc-300">{lectura(datos)}</p>
              <p className="text-xs text-zinc-400 mt-2">
                {total.estudiantes} estudiantes en {datos.programa || 'todos los programas'}: {a.estudiantes} atendidos en el
                periodo y {total.conPromedio} con promedio registrado. Un grupo con menos de {datos.minimoGrupo} personas no
                muestra cifras, para no señalar a nadie. Atendido es quien se inscribió a una asesoría ya realizada del
                periodo y no fue marcado como ausente.
              </p>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 mt-4">Todavía no hay suficientes datos</p>
          )}
        </motion.div>
      )}
    </section>
  )
}

export default ImpactoPanel
