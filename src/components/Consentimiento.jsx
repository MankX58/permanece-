import { useState } from 'react'
import { motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import TextoPolitica from './TextoPolitica.jsx'
import { toque } from '../animaciones.js'

// Antes de usar la plataforma hay que leer la política y autorizar el tratamiento de los datos (Ley 1581 de 2012).
function Consentimiento({ nombre, aceptar, rechazar }) {
  const [acepta, setAcepta] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function confirmar() {
    setEnviando(true)
    await aceptar()
    setEnviando(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        role="dialog"
        aria-label="Política de privacidad"
        className="w-full max-w-xl bg-tarjeta border border-borde rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 pt-6 pb-4 border-b border-borde">
          <div className="bg-primario rounded-lg p-2 w-fit">
            <ShieldCheck size={20} />
          </div>
          <h2 className="text-xl font-bold mt-4">
            Antes de empezar{nombre ? ', ' + nombre.split(' ')[0] : ''}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Lee cómo tratamos tus datos personales y danos tu autorización para continuar.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 [color-scheme:dark]">
          <TextoPolitica />
        </div>

        <div className="px-6 py-4 border-t border-borde">
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="mt-0.5 size-4 accent-red-600"
            />
            <span className="text-zinc-300">
              He leído la política y autorizo de forma libre, previa, expresa e informada el tratamiento de mis datos
              personales para las finalidades descritas.
            </span>
          </label>
          <div className="flex items-center justify-end gap-4 mt-4">
            <button onClick={rechazar} className="text-sm text-zinc-400 hover:text-white">
              No acepto, salir
            </button>
            <motion.button
              {...toque}
              disabled={!acepta || enviando}
              onClick={confirmar}
              className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Aceptar y continuar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Consentimiento
