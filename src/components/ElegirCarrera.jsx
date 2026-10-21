import { useState } from 'react'
import { motion } from 'motion/react'
import { GraduationCap, Search, Check } from 'lucide-react'
import { toque } from '../animaciones.js'

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// El estudiante elige su carrera antes de usar la plataforma: limita las materias de las que puede pedir asesorías.
function ElegirCarrera({ nombre, carreras, elegir }) {
  const [busqueda, setBusqueda] = useState('')
  const [elegida, setElegida] = useState('')
  const [enviando, setEnviando] = useState(false)

  const visibles = carreras.filter((carrera) => normalizar(carrera.nombre).includes(normalizar(busqueda)))

  async function confirmar() {
    setEnviando(true)
    await elegir(elegida)
    setEnviando(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        role="dialog"
        aria-label="Elige tu carrera"
        className="w-full max-w-md bg-tarjeta border border-borde rounded-2xl overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="bg-primario rounded-lg p-2 w-fit">
            <GraduationCap size={20} />
          </div>
          <h2 className="text-xl font-semibold mt-4">
            ¿De qué carrera eres{nombre ? ', ' + nombre.split(' ')[0] : ''}?
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Así te mostramos las materias de tu programa.</p>

          <div className="flex items-center gap-2 border border-borde rounded-lg px-3 mt-4 focus-within:border-acento transition-colors">
            <Search size={15} className="text-zinc-400" />
            <input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar carrera..."
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto px-3 pb-2 [color-scheme:dark]">
          {visibles.length === 0 && <p className="text-sm text-zinc-400 px-3 py-3">Sin resultados.</p>}
          {visibles.map((carrera, posicion) => {
            const activa = elegida === carrera.nombre
            return (
              <motion.button
                key={carrera.nombre}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: posicion * 0.02 }}
                onClick={() => setElegida(carrera.nombre)}
                className={
                  'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors ' +
                  (activa ? 'bg-primario/15 text-white' : 'text-zinc-300 hover:bg-zinc-800')
                }
              >
                {carrera.nombre}
                {activa && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-acento">
                    <Check size={16} />
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-borde flex items-center justify-end gap-4">
          <motion.button
            {...toque}
            disabled={!elegida || enviando}
            onClick={confirmar}
            className="shrink-0 bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Continuar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ElegirCarrera
