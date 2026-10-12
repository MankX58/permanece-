import { useState } from 'react'
import { motion } from 'motion/react'
import Estrellas from './Estrellas.jsx'
import { toque } from '../animaciones.js'

// Estrellas y comentario del estudiante sobre una asesoría que ya pasó.
function Valoracion({ asesoria, valorar }) {
  const [estrellas, setEstrellas] = useState(asesoria.miValoracion || 0)
  const [comentario, setComentario] = useState(asesoria.miComentario || '')

  return (
    <div>
      <Estrellas cantidad={estrellas} alCambiar={setEstrellas} />
      <div className="flex gap-2 mt-2">
        <input
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentario"
          className="w-36 min-w-0 flex-1 bg-fondo border border-borde rounded-md px-2.5 py-1 text-xs outline-none focus:border-acento"
        />
        <motion.button
          {...toque}
          disabled={estrellas === 0}
          onClick={() => valorar(asesoria.id, estrellas, comentario)}
          className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-md px-2.5 py-1 text-xs font-semibold"
        >
          Guardar
        </motion.button>
      </div>
    </div>
  )
}

export default Valoracion
