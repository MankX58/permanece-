import { useState } from 'react'
import { motion } from 'motion/react'
import Estrellas from './Estrellas.jsx'
import { toque } from '../animaciones.js'

// Estrellas y comentario del estudiante sobre una asesoría que ya pasó. El comentario y el botón
// aparecen solo cuando hay algo que guardar, para que la lista se lea limpia.
function Valoracion({ asesoria, valorar }) {
  const guardada = asesoria.miValoracion || 0
  const [estrellas, setEstrellas] = useState(guardada)
  const [comentario, setComentario] = useState(asesoria.miComentario || '')
  const [editando, setEditando] = useState(false)

  const cambio = estrellas !== guardada || comentario !== (asesoria.miComentario || '')
  const mostrarCampo = estrellas > 0 && (guardada === 0 || cambio || editando)

  return (
    <div>
      <Estrellas cantidad={estrellas} alCambiar={setEstrellas} />
      {mostrarCampo ? (
        <div className="flex gap-2 mt-2">
          <input
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentario (opcional)"
            className="w-40 min-w-0 flex-1 bg-fondo border border-borde rounded-md px-2.5 py-1 text-xs outline-none focus:border-acento"
          />
          <motion.button
            {...toque}
            disabled={estrellas === 0 || (guardada > 0 && !cambio)}
            onClick={async () => {
              await valorar(asesoria.id, estrellas, comentario)
              setEditando(false)
            }}
            className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-md px-2.5 py-1 text-xs font-semibold"
          >
            Guardar
          </motion.button>
        </div>
      ) : (
        guardada > 0 && (
          <p className="text-xs text-zinc-400 mt-1.5">
            {asesoria.miComentario ? '“' + asesoria.miComentario + '” · ' : ''}
            <button onClick={() => setEditando(true)} className="hover:text-white underline-offset-2 hover:underline">
              Editar
            </button>
          </p>
        )
      )}
    </div>
  )
}

export default Valoracion
