import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, TrendingUp } from 'lucide-react'
import { ultimosPeriodos } from '../periodos.js'
import { toque } from '../animaciones.js'

// El estudiante registra su promedio por periodo. Es opcional: la coordinación solo ve cifras agrupadas, sin nombres.
function MiPromedio({ promedios, guardar, quitar }) {
  const periodos = ultimosPeriodos(3)
  const [periodo, setPeriodo] = useState(periodos[0])
  const [valor, setValor] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    if (await guardar(periodo, valor)) setValor('')
    setEnviando(false)
  }

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-tarjeta border border-borde rounded-2xl p-5 mt-4"
    >
      <div className="flex items-center gap-3">
        <div className="bg-zinc-800 rounded-full p-2 text-acento">
          <TrendingUp size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wider text-zinc-400">MI PROMEDIO ACADÉMICO</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Opcional. Ayuda a medir si las asesorías sirven; tu coordinador solo ve cifras agrupadas, nunca tu nombre.
          </p>
        </div>
      </div>

      <form onSubmit={enviar} className="flex flex-wrap items-center gap-3 mt-4">
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
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Ej. 3.8"
          className={claseCampo + ' w-28'}
        />
        <motion.button
          {...toque}
          type="submit"
          disabled={enviando || valor === ''}
          className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Guardar
        </motion.button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mt-4 min-h-7">
        <AnimatePresence initial={false}>
          {promedios.map((p) => (
            <motion.span
              key={p.periodo}
              layout
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="flex items-center gap-1.5 text-xs bg-fondo border border-borde rounded-full pl-3 pr-1.5 py-1"
            >
              <span className="text-zinc-400">{p.periodo}</span>
              <span className="font-semibold">{p.promedio.toFixed(2)}</span>
              <button
                onClick={() => quitar(p.periodo)}
                aria-label={'Quitar el promedio de ' + p.periodo}
                className="p-0.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-800"
              >
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {promedios.length === 0 && <span className="text-xs text-zinc-600">Aún no has registrado ningún periodo.</span>}
      </div>
      {promedios.length === 1 && (
        <p className="text-xs text-zinc-500 mt-2">Con un segundo periodo seguido se puede medir cómo cambió tu promedio.</p>
      )}
    </motion.section>
  )
}

export default MiPromedio
