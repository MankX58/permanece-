import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, Compass } from 'lucide-react'
import { preguntas } from '../data.js'
import { lista, item, desplegar } from '../animaciones.js'

function CentroAyuda({ verIntroduccion }) {
  const [abierta, setAbierta] = useState(null)

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Centro de Ayuda</h1>

      <button
        onClick={verIntroduccion}
        className="mt-5 flex items-center gap-2 text-sm font-semibold border border-borde hover:border-primario/60 hover:bg-zinc-900/60 rounded-xl px-4 py-3 transition-colors"
      >
        <Compass size={16} className="text-acento" />
        Ver la introducción de mi rol
      </button>

      <motion.div variants={lista} initial="oculto" animate="visible" className="space-y-2.5 mt-6">
        {preguntas.map((pregunta) => (
          <motion.div key={pregunta.id} variants={item} className="bg-tarjeta border border-borde rounded-xl">
            <button
              onClick={() => setAbierta(abierta === pregunta.id ? null : pregunta.id)}
              className="w-full flex items-center justify-between gap-4 p-4 text-left text-sm font-semibold"
            >
              {pregunta.pregunta}
              <motion.span animate={{ rotate: abierta === pregunta.id ? 180 : 0 }}>
                <ChevronDown size={16} />
              </motion.span>
            </button>
            <AnimatePresence>
              {abierta === pregunta.id && (
                <motion.div {...desplegar} className="overflow-hidden">
                  <p className="text-sm text-zinc-400 px-4 pb-4">{pregunta.respuesta}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default CentroAyuda
