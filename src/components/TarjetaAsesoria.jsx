import { motion } from 'motion/react'
import { MapPin, Video } from 'lucide-react'
import CajaClicable from './CajaClicable.jsx'
import { mesDe, diaDe } from '../fechas.js'
import { toque } from '../animaciones.js'

function TarjetaAsesoria({ asesoria, inscribir, cancelar, abrirDetalle }) {
  const esMia = asesoria.esMia
  const inscrita = asesoria.inscrita
  const lleno = asesoria.inscritos >= asesoria.cupos && !inscrita
  const libres = Math.max(0, asesoria.cupos - asesoria.inscritos)
  const ocupacion = Math.min(100, (asesoria.inscritos / asesoria.cupos) * 100)

  // Un solo aviso de estado por tarjeta; el resto de datos va en texto normal.
  const estado = esMia ? 'Tu asesoría' : inscrita ? 'Inscrito' : lleno ? 'Sin cupos' : null

  const claseBoton = 'w-full py-2 rounded-lg text-sm font-medium transition-colors '

  let boton
  if (esMia || lleno) {
    boton = null
  } else if (inscrita) {
    boton = (
      <motion.button {...toque} onClick={() => cancelar(asesoria.id)} className={claseBoton + 'text-zinc-400 hover:text-white hover:bg-zinc-800'}>
        Cancelar inscripción
      </motion.button>
    )
  } else {
    boton = (
      <motion.button {...toque} onClick={() => inscribir(asesoria.id)} className={claseBoton + 'bg-primario hover:bg-red-700 font-semibold'}>
        Inscribirme
      </motion.button>
    )
  }

  return (
    <CajaClicable
      onClick={() => abrirDetalle(asesoria.id)}
      className="h-full bg-tarjeta hover:bg-zinc-900 transition-colors rounded-2xl p-5 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{asesoria.tutor}</p>
          <p className="text-xs text-zinc-400">
            {asesoria.tipo} · {asesoria.virtual ? 'Virtual' : 'Presencial'}
          </p>
        </div>
        {estado && (
          <span
            className={
              'shrink-0 text-xs px-2 py-0.5 rounded-full ' +
              (inscrita ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-400')
            }
          >
            {estado}
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold mt-4">{asesoria.materia}</h3>
      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{asesoria.descripcion}</p>

      <div className="mt-4 space-y-1.5 text-sm">
        <p className="font-medium">
          {diaDe(asesoria.fecha)} {mesDe(asesoria.fecha).toLowerCase()} · {asesoria.horario}
        </p>
        <p className="flex items-center gap-1.5 text-zinc-400 text-xs">
          {asesoria.virtual ? <Video size={13} /> : <MapPin size={13} />}
          {asesoria.lugar}
        </p>
      </div>

      <div className="mt-4">
        <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-500 rounded-full" style={{ width: ocupacion + '%' }} />
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">
          {lleno ? 'Sin cupos' : libres + (libres === 1 ? ' cupo libre' : ' cupos libres')} · {asesoria.inscritos} de{' '}
          {asesoria.cupos} inscritos
        </p>
      </div>

      {boton && <div className="mt-auto pt-4">{boton}</div>}
    </CajaClicable>
  )
}

export default TarjetaAsesoria
