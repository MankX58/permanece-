import { motion } from 'motion/react'
import Valoracion from './Valoracion.jsx'
import { fechaCorta } from '../fechas.js'
import { item } from '../animaciones.js'

function FilaHistorial({ asesoria, valorar, abrirDetalle }) {
  return (
    <motion.tr
      variants={item}
      onClick={(e) => {
        if (!e.target.closest('button, a, input, textarea, select')) abrirDetalle(asesoria.id)
      }}
      className="border-b border-borde last:border-0 align-top cursor-pointer hover:bg-zinc-900/60 transition-colors"
    >
      <td className="p-4 whitespace-nowrap text-sm font-medium">{fechaCorta(asesoria.fecha)}</td>
      <td className="p-4">
        <p className="text-sm font-semibold">
          <button onClick={() => abrirDetalle(asesoria.id)} className="text-left hover:underline">
            {asesoria.materia}
          </button>
        </p>
        <p className="text-xs text-zinc-400">
          {asesoria.tutor}
          {asesoria.privada ? ' · Individual' : ''}
        </p>
      </td>
      <td className="p-4 text-xs text-zinc-400 max-w-xs">
        <p>{asesoria.descripcion}</p>
        {asesoria.resumen && (
          <p className="mt-2 text-zinc-300">
            <span className="text-zinc-500">Retroalimentación del mentor: </span>
            {asesoria.resumen}
          </p>
        )}
      </td>
      <td className="p-4">
        <Valoracion asesoria={asesoria} valorar={valorar} />
      </td>
    </motion.tr>
  )
}

export default FilaHistorial
