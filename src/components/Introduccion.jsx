import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GraduationCap, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { introduccionDe } from '../introduccion.js'
import { toque } from '../animaciones.js'

// Recorrido corto, por rol, de qué es la plataforma, qué se puede hacer y qué se espera de la persona.
function Introduccion({ rol, nombre, cerrar }) {
  const contenido = introduccionDe(rol)
  const [paso, setPaso] = useState(0)
  const actual = contenido.pasos[paso]
  const ultimo = paso === contenido.pasos.length - 1

  useEffect(() => {
    function alTeclear(e) {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [cerrar])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        role="dialog"
        aria-label="Introducción"
        className="w-full max-w-lg bg-tarjeta border border-borde rounded-2xl overflow-hidden"
      >
        <div className="px-7 pt-7 pb-5 border-b border-borde">
          <div className="flex items-center gap-3">
            <div className="bg-primario rounded-lg p-2">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-base font-bold">{contenido.titulo}</p>
              <p className="text-xs text-zinc-400">
                {nombre ? nombre.split(' ')[0] + ' · ' : ''}
                {contenido.subtitulo}
              </p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 min-h-72">
          <AnimatePresence mode="wait">
            <motion.div
              key={paso}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.16 }}
            >
              <p className="text-[11px] font-bold tracking-wider text-acento">
                PASO {paso + 1} DE {contenido.pasos.length}
              </p>
              <h2 className="text-xl font-bold mt-1.5">{actual.titulo}</h2>
              <p className="text-sm text-zinc-300 mt-3">{actual.texto}</p>
              <ul className="mt-4 space-y-2.5">
                {actual.puntos.map((punto) => (
                  <li key={punto} className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="mt-2 size-1.5 rounded-full bg-acento shrink-0" />
                    {punto}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-7 py-4 border-t border-borde flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {contenido.pasos.map((_, posicion) => (
              <button
                key={posicion}
                onClick={() => setPaso(posicion)}
                aria-label={'Ir al paso ' + (posicion + 1)}
                className={
                  'h-1.5 rounded-full transition-all ' +
                  (posicion === paso ? 'w-6 bg-acento' : 'w-1.5 bg-zinc-600 hover:bg-zinc-500')
                }
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            {!ultimo && (
              <button onClick={cerrar} className="text-xs font-medium text-zinc-500 hover:text-white transition-colors">
                Omitir
              </button>
            )}
            {paso > 0 && (
              <button
                onClick={() => setPaso(paso - 1)}
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                Anterior
              </button>
            )}
            <motion.button
              {...toque}
              onClick={ultimo ? cerrar : () => setPaso(paso + 1)}
              className="flex items-center gap-2 bg-primario hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            >
              {ultimo ? (
                <>
                  Empezar
                  <Check size={15} />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight size={15} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Introduccion
