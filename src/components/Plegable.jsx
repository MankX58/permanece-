import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { desplegar } from '../animaciones.js'

// Sección con título y contador que se contrae y se expande. Los controles de la derecha (filtros, botones)
// van en `acciones` y siguen a la vista aunque la lista esté contraída. Con `abierto` y `alCambiar` el padre
// decide cuándo se abre (por ejemplo, al pulsar "Nueva solicitud").
function Plegable({
  titulo,
  subtitulo,
  cantidad,
  acciones,
  abiertoInicial = true,
  abierto: controlado,
  alCambiar,
  claseTitulo = 'text-lg font-semibold',
  className = '',
  children,
}) {
  const [interno, setInterno] = useState(abiertoInicial)
  const abierto = controlado ?? interno

  function alternar() {
    if (alCambiar) alCambiar(!abierto)
    else setInterno(!abierto)
  }

  return (
    <section className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className={claseTitulo}>
          <button onClick={alternar} aria-expanded={abierto} className="group flex items-center gap-2 text-left">
            <motion.span
              animate={{ rotate: abierto ? 0 : -90 }}
              transition={{ duration: 0.15 }}
              className="flex text-zinc-400 group-hover:text-white"
            >
              <ChevronDown size={18} />
            </motion.span>
            {titulo}
            {cantidad !== undefined && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primario/15 text-red-300">{cantidad}</span>
            )}
            {subtitulo && <span className="text-sm font-normal text-zinc-400">{subtitulo}</span>}
          </button>
        </h2>
        {acciones}
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div {...desplegar} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default Plegable
