import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  Trash2,
  ArrowRight,
  Video,
  MapPin,
  CalendarDays,
  Clock,
  UserRound,
  ChevronRight,
  CalendarClock,
  Users,
} from 'lucide-react'
import SelectorMateria from '../components/SelectorMateria.jsx'
import Valoracion from '../components/Valoracion.jsx'
import CajaClicable from '../components/CajaClicable.jsx'
import { urgencias, maxCompaneros } from '../data.js'
import { fechaCorta, fechaDeHoy, mesDe, diaDe, hace } from '../fechas.js'
import { item, toque } from '../animaciones.js'

const filtros = ['Todas', 'Pendientes', 'Por confirmar', 'Aceptadas']

const claseInsignia = 'text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md border '
const insignias = {
  pendiente: claseInsignia + 'bg-zinc-800 text-zinc-300 border-zinc-700',
  aceptada: claseInsignia + 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  urgente: claseInsignia + 'bg-primario/10 text-acento border-primario/40',
  confirmar: claseInsignia + 'bg-amber-500/10 text-amber-400 border-amber-500/40',
}
const claseDato = 'flex items-center gap-1.5 text-xs text-zinc-300 bg-fondo border border-borde rounded-lg px-2.5 py-1.5'

function MisSolicitudes({
  asesorias,
  cancelar,
  solicitudes,
  agregarSolicitud,
  eliminarSolicitud,
  verEnBanco,
  valorar,
  abrirDetalle,
  catalogo,
  carrera,
  responderPropuesta,
}) {
  const [materia, setMateria] = useState('')
  const [tema, setTema] = useState('')
  const [urgencia, setUrgencia] = useState(urgencias[1])
  const [companeros, setCompaneros] = useState(0)
  const [filtro, setFiltro] = useState('Todas')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  // Día y hora que el estudiante sugiere al pedir la asesoría.
  const [sugerida, setSugerida] = useState({ fecha: '', inicio: '', fin: '' })
  // Al rechazar una propuesta puede dejar un horario nuevo (opcional) para los demás mentores.
  const [rechazando, setRechazando] = useState(null)

  const proximas = asesorias.filter((asesoria) => asesoria.inscrita && !asesoria.pasada)
  const mias = solicitudes.filter((solicitud) => solicitud.esMia).reverse()
  // "Por confirmar": un mentor propuso otro horario y espera la respuesta del estudiante.
  const esPropuesta = (solicitud) => Boolean(solicitud.propuesta) && !solicitud.asesoriaId
  const pendientes = mias.filter((solicitud) => !solicitud.aceptada)
  const porConfirmar = mias.filter(esPropuesta)
  const aceptadas = mias.filter((solicitud) => solicitud.aceptada && !esPropuesta(solicitud))
  const porFiltro = { Todas: mias, Pendientes: pendientes, 'Por confirmar': porConfirmar, Aceptadas: aceptadas }
  const visibles = porFiltro[filtro]

  function disponibles(nombre) {
    return asesorias.filter(
      (asesoria) =>
        asesoria.materia === nombre &&
        !asesoria.pasada &&
        !asesoria.inscrita &&
        !asesoria.esMia &&
        asesoria.inscritos < asesoria.cupos
    ).length
  }

  function enviar(e) {
    e.preventDefault()
    agregarSolicitud({
      materia,
      tema,
      urgencia,
      companeros,
      fecha: sugerida.fecha,
      horario: sugerida.inicio + ' - ' + sugerida.fin,
    })
    setMateria('')
    setCompaneros(0)
    setTema('')
    setSugerida({ fecha: '', inicio: '', fin: '' })
    setFiltro('Todas')
    setMostrarFormulario(false)
  }

  async function rechazar(e) {
    e.preventDefault()
    const nueva = rechazando.fecha && rechazando.inicio && rechazando.fin
      ? { fecha: rechazando.fecha, horario: rechazando.inicio + ' - ' + rechazando.fin }
      : {}
    if (await responderPropuesta(rechazando.id, false, nueva)) setRechazando(null)
  }

  function eliminar(solicitud, sesion) {
    const hayAgenda = sesion && !sesion.pasada
    const aviso = 'Se cancelará la sesión agendada con ' + solicitud.mentor + '. ¿Eliminar la solicitud?'

    if (!hayAgenda || window.confirm(aviso)) {
      eliminarSolicitud(solicitud.id)
    }
  }

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Mis Solicitudes</h1>

      <div className="flex items-center gap-3 mt-8 mb-4">
        <h2 className="text-lg font-bold">Próximas sesiones</h2>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
          {proximas.length}
        </span>
      </div>

      {proximas.length === 0 && (
        <p className="text-sm text-zinc-500 bg-tarjeta border border-dashed border-borde rounded-xl p-5">
          Aún no tienes sesiones. Inscríbete en el banco o pide una asesoría abajo.
        </p>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {proximas.map((asesoria) => (
            <CajaClicable
              key={asesoria.id}
              layout
              variants={item}
              initial="oculto"
              animate="visible"
              exit="salida"
              onClick={() => abrirDetalle(asesoria.id)}
              className="bg-tarjeta border border-borde border-l-4 border-l-primario rounded-xl p-4 flex items-center gap-4"
            >
              <div className="shrink-0 bg-fondo border border-borde rounded-xl px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-acento">{mesDe(asesoria.fecha)}</p>
                <p className="text-xl font-bold leading-tight">{diaDe(asesoria.fecha)}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold">{asesoria.materia}</span>
                  {asesoria.privada && <span className={insignias.pendiente}>INDIVIDUAL</span>}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">{asesoria.tutor}</p>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  <span className={claseDato}>
                    <Clock size={13} className="text-acento" />
                    {asesoria.horario}
                  </span>
                  <span className={claseDato}>
                    {asesoria.virtual ? (
                      <Video size={13} className="text-acento" />
                    ) : (
                      <MapPin size={13} className="text-acento" />
                    )}
                    {asesoria.virtual ? 'Virtual' : asesoria.lugar}
                  </span>
                  {asesoria.virtual &&
                    (asesoria.enlace ? (
                      <a
                        href={asesoria.enlace}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold bg-primario hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        Entrar a la reunión
                      </a>
                    ) : (
                      <span className={claseDato + ' text-zinc-500'}>El mentor compartirá el enlace</span>
                    ))}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-3 self-stretch justify-between">
                <ChevronRight size={18} className="text-zinc-500" />
                {!asesoria.privada && (
                  <button
                    onClick={() => cancelar(asesoria.id)}
                    className="text-xs font-medium text-zinc-500 hover:text-acento transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </CajaClicable>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-10 pb-3 border-b border-borde">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Solicitudes actuales</h2>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
            Total: {mias.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filtros.map((opcion) => (
            <button
              key={opcion}
              onClick={() => setFiltro(opcion)}
              className={
                'text-xs font-bold px-3.5 py-1.5 rounded-full border transition-colors ' +
                (filtro === opcion
                  ? 'bg-acento border-acento text-white'
                  : 'bg-tarjeta border-borde text-zinc-400 hover:text-white')
              }
            >
              {opcion} <span className="opacity-70">{porFiltro[opcion].length}</span>
            </button>
          ))}
          <motion.button
            {...toque}
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-primario hover:bg-red-700 transition-colors"
          >
            <motion.span animate={{ rotate: mostrarFormulario ? 45 : 0 }} className="flex">
              <Plus size={14} />
            </motion.span>
            Nueva solicitud
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {mostrarFormulario && (
          <motion.form
            onSubmit={enviar}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 bg-tarjeta border border-borde rounded-xl p-4 grid md:grid-cols-2 gap-3 mt-4"
          >
            <div>
              <SelectorMateria catalogo={catalogo} value={materia} onChange={setMateria} className={claseCampo} />
            </div>
            <select value={urgencia} onChange={(e) => setUrgencia(e.target.value)} className={claseCampo}>
              {urgencias.map((opcion) => (
                <option key={opcion}>{opcion}</option>
              ))}
            </select>
            <textarea
              required
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="¿Con qué tema necesitas ayuda?"
              rows={2}
              className={claseCampo + ' md:col-span-2'}
            />
            <div className="md:col-span-2">
              <p className="text-xs text-zinc-400 mb-1.5">¿Cuándo te sirve?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  required
                  type="date"
                  min={fechaDeHoy()}
                  value={sugerida.fecha}
                  onChange={(e) => setSugerida({ ...sugerida, fecha: e.target.value })}
                  aria-label="Día que te sirve"
                  className={claseCampo}
                />
                <input
                  required
                  type="time"
                  value={sugerida.inicio}
                  onChange={(e) => setSugerida({ ...sugerida, inicio: e.target.value })}
                  aria-label="Hora de inicio"
                  className={claseCampo}
                />
                <input
                  required
                  type="time"
                  min={sugerida.inicio}
                  value={sugerida.fin}
                  onChange={(e) => setSugerida({ ...sugerida, fin: e.target.value })}
                  aria-label="Hora de fin"
                  className={claseCampo}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-400">¿Cómo quieres recibirla?</p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <div className="flex border border-borde rounded-lg p-1">
                  {['Solo yo', 'Grupal'].map((opcion) => {
                    const activa = (opcion === 'Grupal') === companeros > 0
                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() => setCompaneros(opcion === 'Grupal' ? Math.max(companeros, 1) : 0)}
                        className={
                          'relative px-3 py-1 rounded-md text-xs font-semibold ' +
                          (activa ? 'text-white' : 'text-zinc-300 hover:text-white')
                        }
                      >
                        {activa && (
                          <motion.span
                            layoutId="modo-solicitud"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute inset-0 bg-primario rounded-md"
                          />
                        )}
                        <span className="relative">{opcion}</span>
                      </button>
                    )
                  })}
                </div>
                {companeros > 0 && (
                  <label className="flex items-center gap-2 text-xs text-zinc-400">
                    Hasta
                    <input
                      type="number"
                      min={1}
                      max={maxCompaneros}
                      value={companeros}
                      onChange={(e) =>
                        setCompaneros(Math.min(maxCompaneros, Math.max(1, Math.trunc(Number(e.target.value)) || 1)))
                      }
                      aria-label="Cantidad máxima de compañeros"
                      className={claseCampo + ' w-16 text-center'}
                    />
                    compañeros más
                  </label>
                )}
              </div>
            </div>
            <motion.button
              {...toque}
              className="self-end justify-self-end bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg"
            >
              Enviar solicitud
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {visibles.length === 0 && (
        <p className="text-sm text-zinc-500 bg-tarjeta border border-dashed border-borde rounded-xl p-5 mt-4">
          {mias.length === 0
            ? 'Aún no has pedido ninguna asesoría. Usa «Nueva solicitud» para pedir la primera.'
            : 'No tienes solicitudes en esta categoría.'}
        </p>
      )}

      <div className="space-y-4 mt-4">
        <AnimatePresence mode="popLayout">
          {visibles.map((solicitud) => {
            const sesion = asesorias.find((asesoria) => asesoria.id === solicitud.asesoriaId)
            const cantidad = solicitud.aceptada ? 0 : disponibles(solicitud.materia)
            const realizada = sesion?.pasada || (solicitud.atendida && !sesion)
            const urgente = solicitud.urgencia === urgencias[0] && !realizada

            const propuesta = esPropuesta(solicitud) ? solicitud.propuesta : null

            let estado = 'PENDIENTE'
            if (realizada) estado = 'ATENDIDA'
            else if (sesion) estado = 'AGENDADA'
            else if (propuesta) estado = 'POR CONFIRMAR'
            else if (solicitud.aceptada) estado = 'ACEPTADA'

            return (
              <CajaClicable
                key={solicitud.id}
                layout
                variants={item}
                initial="oculto"
                animate="visible"
                exit="salida"
                onClick={sesion ? () => abrirDetalle(sesion.id) : undefined}
                className={
                  'bg-tarjeta border border-borde border-l-4 rounded-xl p-5 ' +
                  (propuesta ? 'border-l-amber-500' : solicitud.aceptada ? 'border-l-emerald-500' : 'border-l-zinc-600')
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          propuesta ? insignias.confirmar : solicitud.aceptada ? insignias.aceptada : insignias.pendiente
                        }
                      >
                        {estado}
                      </span>
                      {urgente && <span className={insignias.urgente}>URGENTE</span>}
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <CalendarDays size={13} />
                        {fechaCorta(solicitud.creada)} · {hace(solicitud.creada)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold mt-3">{solicitud.materia}</h3>
                    <p className="text-sm text-zinc-400 mt-1">{solicitud.tema}</p>

                    <div className="flex flex-wrap gap-2 mt-3.5">
                      <span className={claseDato}>
                        <Clock size={13} className="text-acento" />
                        {solicitud.urgencia}
                      </span>
                      <span className={claseDato}>
                        <Users size={13} className="text-acento" />
                        {solicitud.companeros > 0 ? 'Grupal · +' + solicitud.companeros : 'Individual'}
                      </span>
                      {solicitud.sugeridaFecha && !sesion && (
                        <span className={claseDato}>
                          <CalendarClock size={13} className="text-acento" />
                          Sugeriste: {fechaCorta(solicitud.sugeridaFecha)}, {solicitud.sugeridaHorario}
                        </span>
                      )}
                      {solicitud.mentor && (
                        <span className={claseDato}>
                          <UserRound size={13} className="text-acento" />
                          {solicitud.mentor}
                        </span>
                      )}
                      {cantidad > 0 && (
                        <button
                          onClick={() => verEnBanco(solicitud.materia)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-acento bg-primario/10 border border-primario/30 hover:bg-primario/20 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                          {cantidad} {cantidad === 1 ? 'asesoría disponible' : 'asesorías disponibles'}
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => eliminar(solicitud, sesion)}
                    title="Eliminar solicitud"
                    className="shrink-0 p-2.5 rounded-lg bg-primario/5 border border-primario/20 text-zinc-400 hover:text-acento hover:border-primario/60 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {propuesta && (
                  <div className="mt-4 bg-amber-500/5 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 size-10 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <CalendarClock size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{solicitud.mentor} te propone otro horario</p>
                        <p className="text-sm text-amber-300 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                          {fechaCorta(propuesta.fecha)}, {propuesta.horario} ·
                          {propuesta.virtual ? <Video size={13} /> : <MapPin size={13} />}
                          {propuesta.virtual ? 'Virtual' : propuesta.lugar}
                        </p>
                      </div>
                    </div>

                    {rechazando?.id === solicitud.id ? (
                      <form onSubmit={rechazar} className="mt-4 bg-fondo border border-borde rounded-xl p-3">
                        <p className="text-xs text-zinc-400 mb-2">
                          Otro horario (opcional)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="date"
                            min={fechaDeHoy()}
                            value={rechazando.fecha}
                            onChange={(e) => setRechazando({ ...rechazando, fecha: e.target.value })}
                            aria-label="Nuevo día"
                            className={claseCampo + ' bg-tarjeta'}
                          />
                          <input
                            type="time"
                            value={rechazando.inicio}
                            onChange={(e) => setRechazando({ ...rechazando, inicio: e.target.value })}
                            aria-label="Nueva hora de inicio"
                            className={claseCampo + ' bg-tarjeta'}
                          />
                          <input
                            type="time"
                            min={rechazando.inicio}
                            value={rechazando.fin}
                            onChange={(e) => setRechazando({ ...rechazando, fin: e.target.value })}
                            aria-label="Nueva hora de fin"
                            className={claseCampo + ' bg-tarjeta'}
                          />
                        </div>
                        <div className="flex justify-end gap-4 items-center mt-3">
                          <button
                            type="button"
                            onClick={() => setRechazando(null)}
                            className="text-xs font-medium text-zinc-400 hover:text-white"
                          >
                            Volver
                          </button>
                          <motion.button
                            {...toque}
                            className="text-xs font-bold border border-primario/50 text-acento hover:bg-primario/10 rounded-lg px-3.5 py-2"
                          >
                            Rechazar propuesta
                          </motion.button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap justify-end gap-3 mt-4">
                        <button
                          onClick={() => setRechazando({ id: solicitud.id, fecha: '', inicio: '', fin: '' })}
                          className="text-xs font-semibold text-zinc-300 hover:text-white border border-borde rounded-lg px-3.5 py-2"
                        >
                          No me sirve
                        </button>
                        <motion.button
                          {...toque}
                          onClick={() => responderPropuesta(solicitud.id, true)}
                          className="text-xs font-bold bg-primario hover:bg-red-700 rounded-lg px-3.5 py-2"
                        >
                          Aceptar horario
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}

                {solicitud.aceptada && !propuesta && (
                  <div className="mt-4 flex items-center gap-3 bg-primario/5 border border-primario/20 rounded-xl p-3">
                    <div className="shrink-0 size-10 rounded-full bg-primario/20 text-acento flex items-center justify-center">
                      <UserRound size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Asignado a: {solicitud.mentor || 'un mentor'}</p>
                      <p className="text-xs text-acento mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        {sesion ? (
                          <>
                            {sesion.pasada ? 'Sesión realizada' : 'Sesión programada'}: {fechaCorta(sesion.fecha)},{' '}
                            {sesion.horario} ·
                            {sesion.virtual ? <Video size={12} /> : <MapPin size={12} />}
                            {sesion.virtual ? 'Virtual' : sesion.lugar}
                          </>
                        ) : realizada ? (
                          'Atendida por el mentor'
                        ) : (
                          'Esperando que el mentor agende la sesión'
                        )}
                      </p>
                    </div>
                    {sesion && (
                      <button
                        onClick={() => abrirDetalle(sesion.id)}
                        className="shrink-0 text-xs font-bold bg-primario hover:bg-red-700 rounded-lg px-3.5 py-2 transition-colors"
                      >
                        Ver detalle
                      </button>
                    )}
                  </div>
                )}

                {sesion?.pasada && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-4">
                    <div className="bg-fondo border border-borde rounded-xl p-3">
                      <p className="text-xs font-semibold text-zinc-500 mb-1.5">RETROALIMENTACIÓN DEL MENTOR</p>
                      {sesion.resumen ? (
                        <p className="text-xs text-zinc-300">{sesion.resumen}</p>
                      ) : (
                        <p className="text-xs text-zinc-500">El mentor aún no deja retroalimentación.</p>
                      )}
                    </div>
                    <div className="bg-fondo border border-borde rounded-xl p-3">
                      <p className="text-xs font-semibold text-zinc-500 mb-1.5">TU VALORACIÓN</p>
                      <Valoracion asesoria={sesion} valorar={valorar} />
                    </div>
                  </div>
                )}
              </CajaClicable>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MisSolicitudes
