import { motion } from 'motion/react'
import { MapPin, Video, UserCheck, X } from 'lucide-react'
import CajaClicable from './CajaClicable.jsx'
import { mesDe, diaDe } from '../fechas.js'
import { toque } from '../animaciones.js'

function TarjetaAsesoria({ asesoria, inscribir, cancelar, abrirDetalle }) {
  const esMia = asesoria.esMia
  const inscrita = asesoria.inscrita
  const esDocente = asesoria.tipo === 'Docente'
  const lleno = asesoria.inscritos >= asesoria.cupos && !inscrita
  const ocupacion = Math.min(100, (asesoria.inscritos / asesoria.cupos) * 100)
  const iniciales = asesoria.tutor
    .split(' ')
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)

  const claseBoton = 'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold '

  let boton
  if (esMia) {
    boton = (
      <button disabled className={claseBoton + 'bg-zinc-800 text-zinc-500'}>
        Es tu asesoría
      </button>
    )
  } else if (inscrita) {
    boton = (
      <motion.button
        {...toque}
        onClick={() => cancelar(asesoria.id)}
        className={claseBoton + 'border border-borde hover:bg-zinc-800'}
      >
        <X size={16} />
        Cancelar inscripción
      </motion.button>
    )
  } else if (lleno) {
    boton = (
      <button disabled className={claseBoton + 'bg-zinc-800 text-zinc-500'}>
        Sin cupos
      </button>
    )
  } else {
    boton = (
      <motion.button
        {...toque}
        onClick={() => inscribir(asesoria.id)}
        className={claseBoton + 'bg-primario hover:bg-red-700'}
      >
        <UserCheck size={16} />
        Inscribirse
      </motion.button>
    )
  }

  return (
    <CajaClicable
      onClick={() => abrirDetalle(asesoria.id)}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="h-full bg-tarjeta border border-borde rounded-2xl p-5 flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-borde flex items-center justify-center text-xs font-bold">
            {iniciales}
          </div>
          <div>
            <p className="text-sm font-semibold">{asesoria.tutor}</p>
            <p className="text-xs text-zinc-500">{asesoria.rol}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={
              'text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full border ' +
              (esDocente ? 'border-primario text-acento bg-primario/10' : 'border-zinc-600 text-zinc-300')
            }
          >
            {asesoria.tipo.toUpperCase()}
          </span>
          <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
            {asesoria.virtual ? 'VIRTUAL' : 'PRESENCIAL'}
          </span>
          {lleno && (
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primario/20 text-acento">
              CUPO LLENO
            </span>
          )}
          {inscrita && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400"
            >
              INSCRITO
            </motion.span>
          )}
        </div>
      </div>

      <h3 className="text-base font-bold mt-4">
        <button onClick={() => abrirDetalle(asesoria.id)} className="text-left hover:underline">
          {asesoria.materia}
        </button>
      </h3>
      <p className="text-sm text-zinc-400 mt-1">{asesoria.descripcion}</p>
      <button
        onClick={() => abrirDetalle(asesoria.id)}
        className="self-start text-xs font-medium text-zinc-400 hover:text-white transition-colors mt-2"
      >
        Ver detalle
      </button>

      <div className="flex items-center gap-3 border border-borde rounded-xl p-3 mt-4">
        <div className="bg-fondo rounded-lg px-2.5 py-1 text-center">
          <p className="text-[10px] text-zinc-400">{mesDe(asesoria.fecha)}</p>
          <p className="text-base font-bold leading-tight">{diaDe(asesoria.fecha)}</p>
        </div>
        <div>
          <p className="text-sm font-semibold">{asesoria.horario}</p>
          <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
            {asesoria.virtual ? (
              <Video size={14} className="text-acento" />
            ) : (
              <MapPin size={14} className="text-acento" />
            )}
            {asesoria.lugar}
          </p>
        </div>
      </div>

      <div className="mt-4 mb-4">
        <p className="text-xs text-zinc-500">
          {lleno ? 'Sin cupos' : Math.max(0, asesoria.cupos - asesoria.inscritos) + ' cupos libres'} ·{' '}
          {asesoria.inscritos}/{asesoria.cupos} inscritos
        </p>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: ocupacion + '%' }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="h-full bg-acento rounded-full"
          />
        </div>
      </div>

      <div className="mt-auto">{boton}</div>
    </CajaClicable>
  )
}

export default TarjetaAsesoria
