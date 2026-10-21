import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { ultimosPeriodos } from '../periodos.js'
import { desplegar, toque } from '../animaciones.js'

// El estudiante registra su promedio por periodo. Es opcional: la coordinación solo ve cifras agrupadas, sin nombres.
// Una línea con lo registrado; el formulario se abre solo cuando se quiere agregar o corregir un periodo.
function MiPromedio({ promedios, guardar, quitar }) {
  const periodos = ultimosPeriodos(3)
  const [abierto, setAbierto] = useState(false)
  const [periodo, setPeriodo] = useState(periodos[0])
  const [valor, setValor] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    if (await guardar(periodo, valor)) {
      setValor('')
      setAbierto(false)
    }
    setEnviando(false)
  }

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-1.5 text-sm outline-none focus:border-acento transition-colors'

  return (
    <section className="bg-tarjeta rounded-2xl px-5 py-4 mt-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm font-medium">Mi promedio académico</p>

        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <AnimatePresence initial={false}>
            {promedios.map((p) => (
              <motion.span
                key={p.periodo}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs bg-fondo rounded-full pl-3 pr-1.5 py-1 whitespace-nowrap"
              >
                <span className="text-zinc-400">{p.periodo}</span>
                <span className="font-semibold">{p.promedio.toFixed(2)}</span>
                <button
                  onClick={() => quitar(p.periodo)}
                  aria-label={'Quitar el promedio de ' + p.periodo}
                  className="p-0.5 rounded-full text-zinc-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
          {promedios.length === 0 && <span className="text-xs text-zinc-500">Sin registrar</span>}
        </div>

        <button onClick={() => setAbierto(!abierto)} className="shrink-0 text-xs text-zinc-400 hover:text-white">
          {abierto ? 'Cerrar' : 'Registrar'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div {...desplegar} className="overflow-hidden">
            <form onSubmit={enviar} className="flex flex-wrap items-center gap-3 pt-4">
              <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={claseCampo}>
                {periodos.map((opcion, i) => (
                  <option key={opcion} value={opcion}>
                    {opcion + (i === 0 ? ' (actual)' : '')}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5"
                required
                autoFocus
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ej. 3.8"
                className={claseCampo + ' w-28'}
              />
              <motion.button
                {...toque}
                type="submit"
                disabled={enviando || valor === ''}
                className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 py-1.5 text-sm font-semibold"
              >
                Guardar
              </motion.button>
            </form>
            <p className="text-xs text-zinc-400 mt-3">
              Es opcional y ayuda a medir si las asesorías sirven. Tu coordinador solo ve cifras agrupadas, nunca tu nombre.
              {promedios.length === 1 && ' Con un segundo periodo seguido se mide cómo cambió tu promedio.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default MiPromedio
