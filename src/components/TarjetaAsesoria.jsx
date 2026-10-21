import { motion } from 'motion/react'
import { MapPin, Video, Clock, UserPlus, X } from 'lucide-react'
import CajaClicable from './CajaClicable.jsx'
import { mesDe, diaDe } from '../fechas.js'
import { toque } from '../animaciones.js'

function diaDeSemana(fecha) {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')
}

// Ocupación: un segmento por cupo cuando son pocos, o una barra continua cuando son muchos.
function Cupos({ inscritos, cupos }) {
  if (cupos > 12) {
    return (
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-acento rounded-full" style={{ width: Math.min(100, (inscritos / cupos) * 100) + '%' }} />
      </div>
    )
  }
  return (
    <div className="flex gap-1">
      {Array.from({ length: cupos }, (_, i) => (
        <span key={i} className={'h-1.5 flex-1 rounded-full ' + (i < inscritos ? 'bg-acento' : 'bg-zinc-800')} />
      ))}
    </div>
  )
}

function TarjetaAsesoria({ asesoria, inscribir, cancelar, abrirDetalle }) {
  const esMia = asesoria.esMia
  const inscrita = asesoria.inscrita
  const lleno = asesoria.inscritos >= asesoria.cupos && !inscrita
  const libres = Math.max(0, asesoria.cupos - asesoria.inscritos)
  const iniciales = asesoria.tutor
    .split(' ')
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Un solo aviso de estado por tarjeta; el resto de datos va en texto normal.
  const estado = esMia ? 'Tu asesoría' : inscrita ? 'Inscrito' : lleno ? 'Sin cupos' : null
  const claseEstado = inscrita
    ? 'bg-emerald-500/15 text-emerald-400'
    : lleno
      ? 'bg-primario/15 text-red-300'
      : 'bg-zinc-800 text-zinc-300'

  const claseBoton = 'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-all '

  let boton = null
  if (inscrita) {
    boton = (
      <motion.button
        {...toque}
        onClick={() => cancelar(asesoria.id)}
        className={claseBoton + 'font-medium text-red-300 border border-primario/30 hover:bg-primario/10 hover:border-primario/50'}
      >
        <X size={15} />
        Cancelar inscripción
      </motion.button>
    )
  } else if (!esMia && !lleno) {
    boton = (
      <motion.button
        {...toque}
        onClick={() => inscribir(asesoria.id)}
        className={claseBoton + 'font-semibold bg-primario hover:bg-red-500 shadow-md shadow-red-950/50 ring-1 ring-inset ring-white/15'}
      >
        <UserPlus size={15} />
        Inscribirme
      </motion.button>
    )
  }

  return (
    <CajaClicable
      onClick={() => abrirDetalle(asesoria.id)}
      className="h-full bg-tarjeta ring-1 ring-white/[0.05] hover:ring-primario/30 transition rounded-2xl p-5 flex flex-col"
    >
      <div className="flex gap-4">
        <div className="shrink-0 w-12 text-center">
          <p className="text-xs text-red-400">{mesDe(asesoria.fecha).toLowerCase()}</p>
          <p className="text-3xl font-semibold leading-none mt-1 tabular-nums">{diaDe(asesoria.fecha)}</p>
          <p className="text-xs text-zinc-400 mt-1.5">{diaDeSemana(asesoria.fecha)}</p>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug">{asesoria.materia}</h3>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{asesoria.descripcion}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-acento" />
          {asesoria.horario}
        </span>
        <span className="flex items-center gap-1.5 min-w-0">
          {asesoria.virtual ? <Video size={13} className="text-acento shrink-0" /> : <MapPin size={13} className="text-acento shrink-0" />}
          <span className="truncate">{asesoria.lugar}</span>
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-borde flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0 size-8 rounded-full bg-primario/15 text-red-300 text-xs font-semibold flex items-center justify-center">
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{asesoria.tutor}</p>
            <p className="text-xs text-zinc-400">
              <span className={asesoria.tipo === 'Docente' ? 'text-red-300' : ''}>{asesoria.tipo}</span> ·{' '}
              {asesoria.virtual ? 'Virtual' : 'Presencial'}
            </p>
          </div>
        </div>
        {estado && <span className={'shrink-0 text-xs px-2.5 py-0.5 rounded-full ' + claseEstado}>{estado}</span>}
      </div>

      <div className="mt-4">
        <Cupos inscritos={asesoria.inscritos} cupos={asesoria.cupos} />
        <p className="text-xs text-zinc-400 mt-2">
          {asesoria.inscritos} de {asesoria.cupos} inscritos ·{' '}
          {lleno ? 'sin cupos' : libres + (libres === 1 ? ' cupo libre' : ' cupos libres')}
        </p>
      </div>

      {boton && <div className="mt-auto pt-4">{boton}</div>}
    </CajaClicable>
  )
}

export default TarjetaAsesoria
