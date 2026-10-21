import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CalendarClock,
  Hourglass,
  CalendarPlus,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Users,
  Clock,
  BookOpen,
  UserRound,
  Video,
  MapPin,
  Star,
} from 'lucide-react'
import { AnimatedCounter } from '../components/arc/animated-counter/animated-counter'
import { Sparkline } from '../components/arc/sparkline/sparkline'
import Estrellas from '../components/Estrellas.jsx'
import SelectorMateria from '../components/SelectorMateria.jsx'
import CajaClicable from '../components/CajaClicable.jsx'
import CamposSesion, { sesionVacia, sesionDe, datosDeSesion } from '../components/CamposSesion.jsx'
import { urgencias } from '../data.js'
import { fechaCorta, mesDe, diaDe, horasDe, promedio, hace } from '../fechas.js'
import { lista, item, toque, desplegar } from '../animaciones.js'

const formularioVacio = { ...sesionVacia, materia: '', descripcion: '', cupos: 10 }

const LIMITE_HISTORIAL = 6
const claseDato = 'flex items-center gap-1.5 text-xs text-zinc-300 bg-fondo border border-borde rounded-lg px-2.5 py-1.5'
const insignia = 'text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md border bg-zinc-800 text-zinc-300 border-zinc-700 '
const claseAccion = 'text-xs font-medium text-zinc-400 hover:text-white transition-colors'
const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'
const claseCaja = 'bg-tarjeta border border-borde rounded-xl p-4 grid md:grid-cols-2 gap-3'

function Despliegue({ abierta, clave, children }) {
  return (
    <AnimatePresence initial={false}>
      {abierta === clave && (
        <motion.div {...desplegar} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Detalle({ abierta, alternar, clave, texto }) {
  return (
    <button onClick={() => alternar(clave)} className={claseAccion + ' flex items-center gap-1'}>
      {texto}
      <motion.span animate={{ rotate: abierta === clave ? 180 : 0 }} className="flex">
        <ChevronDown size={13} />
      </motion.span>
    </button>
  )
}

function Asistentes({ personas, conValoracion }) {
  if (personas.length === 0) {
    return <p className="text-xs text-zinc-500 pt-3">Aún no hay inscritos.</p>
  }

  return (
    <ul className="pt-3 space-y-2">
      {personas.map((persona, posicion) => (
        <li key={posicion} className="text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-300">{persona.nombre}</span>
            {conValoracion &&
              (persona.valoracion ? (
                <Estrellas cantidad={persona.valoracion} />
              ) : (
                <span className="text-zinc-600">Sin valorar</span>
              ))}
          </div>
          {persona.comentario && <p className="italic text-zinc-500 mt-0.5">"{persona.comentario}"</p>}
        </li>
      ))}
    </ul>
  )
}

// Respuesta del mentor a una solicitud. Llega con el horario que sugirió el estudiante: si el mentor lo
// deja igual se agenda de una vez; si lo cambia, se envía como propuesta y el estudiante debe aceptarla.
function horarioSugerido(solicitud) {
  return solicitud.sugeridaFecha ? fechaCorta(solicitud.sugeridaFecha) + ', ' + solicitud.sugeridaHorario : null
}

function mismoQueSugerido(valor, solicitud) {
  return (
    Boolean(solicitud.sugeridaFecha) &&
    valor.fecha === solicitud.sugeridaFecha &&
    valor.inicio + ' - ' + valor.fin === solicitud.sugeridaHorario
  )
}

function FormularioRespuesta({ solicitud, valor, cambiar, enviar, cerrar }) {
  const agendaDirecto = mismoQueSugerido(valor, solicitud)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        enviar(agendaDirecto)
      }}
      className={claseCaja + ' mt-4 bg-fondo'}
    >
      <CamposSesion valor={valor} cambiar={cambiar} className={claseCampo + ' bg-tarjeta'} />
      <p className="md:col-span-2 text-xs text-zinc-500">
        {agendaDirecto
          ? 'Es el horario que sugirió ' + solicitud.estudiante + ': la asesoría queda agendada de una vez.'
          : solicitud.sugeridaFecha
            ? 'Cambiaste el horario que sugirió ' + solicitud.estudiante + ' (' + horarioSugerido(solicitud) +
              '). Se le enviará como propuesta y deberá aceptarla.'
            : solicitud.estudiante + ' recibirá esta propuesta y deberá aceptarla.'}
      </p>
      <div className="md:col-span-2 flex justify-end gap-4 items-center">
        <button type="button" onClick={cerrar} className={claseAccion}>
          Cerrar
        </button>
        <motion.button {...toque} className="bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg">
          {agendaDirecto ? 'Agendar con este horario' : 'Enviar propuesta'}
        </motion.button>
      </div>
    </form>
  )
}

// Dónde y cómo es la sesión, en una línea.
function modalidadDe(asesoria) {
  if (!asesoria.virtual) return 'Presencial · ' + asesoria.lugar
  return asesoria.enlace ? 'Virtual' : 'Virtual · falta el enlace'
}

function PortalMentores({
  yo,
  asesorias,
  agregarAsesoria,
  eliminarAsesoria,
  editarAsesoria,
  guardarResumen,
  abrirDetalle,
  solicitudes,
  aceptarSolicitud,
  proponerHorario,
  liberarSolicitud,
  atenderSolicitud,
  catalogo,
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formulario, setFormulario] = useState(formularioVacio)
  const [respondiendo, setRespondiendo] = useState(null)
  const [editando, setEditando] = useState(null)
  const [resumenes, setResumenes] = useState({})
  const [abierta, setAbierta] = useState(null)
  const [verTodo, setVerTodo] = useState(false)

  const mias = asesorias.filter((asesoria) => asesoria.esMia)
  const proximas = mias.filter((asesoria) => !asesoria.pasada)
  const impartidas = mias.filter((asesoria) => asesoria.pasada)
  // Mentores y docentes solo ven y atienden sus materias asignadas (sin materias, ninguna).
  // alcance null = sin restricción (admin).
  const alcance = yo.materiasAsignadas ?? null
  const sinMaterias = Array.isArray(alcance) && alcance.length === 0
  const puedeAtender = (materia) => alcance === null || alcance.includes(materia)
  const catalogoPropio =
    alcance === null
      ? catalogo
      : catalogo
          .map((carrera) => ({ ...carrera, materias: carrera.materias.filter((materia) => alcance.includes(materia)) }))
          .filter((carrera) => carrera.materias.length > 0)

  const libres = solicitudes.filter((solicitud) => !solicitud.esMia && !solicitud.aceptada)
  const pendientes = libres
    .filter((solicitud) => puedeAtender(solicitud.materia))
    .sort((a, b) => urgencias.indexOf(a.urgencia) - urgencias.indexOf(b.urgencia) || a.id - b.id)
  const fueraDeAlcance = libres.length - pendientes.length
  const reservadas = solicitudes.filter(
    (solicitud) => solicitud.aceptadaPorMi && !solicitud.atendida && !solicitud.asesoriaId
  )
  const esperando = reservadas.filter((solicitud) => solicitud.propuesta)
  const porAgendar = reservadas.filter((solicitud) => !solicitud.propuesta)
  const atendidas = solicitudes.filter((solicitud) => solicitud.aceptadaPorMi && solicitud.atendida)
  const programadas = proximas.length + reservadas.length
  const sinEnlace = proximas.filter((asesoria) => asesoria.virtual && !asesoria.enlace).length

  const historial = [
    ...impartidas.map((asesoria) => ({ clave: 'a-' + asesoria.id, fecha: asesoria.fecha, asesoria })),
    ...atendidas.map((solicitud) => ({ clave: 's-' + solicitud.id, fecha: solicitud.atendidaEn, solicitud })),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha))

  let estudiantes = atendidas.length
  let horas = 0
  const valoradas = []
  impartidas.forEach((asesoria) => {
    estudiantes += asesoria.asistentes.length
    horas += horasDe(asesoria.horario)

    const valores = asesoria.asistentes.filter((p) => p.valoracion).map((p) => p.valoracion)
    if (valores.length > 0) {
      valoradas.push({ fecha: asesoria.fecha, valores })
    }
  })

  valoradas.sort((a, b) => a.fecha.localeCompare(b.fecha))
  const todasLasValoraciones = valoradas.flatMap((sesion) => sesion.valores)
  const calificacion = promedio(todasLasValoraciones)
  const tendencia = valoradas.map((sesion) => Number(promedio(sesion.valores)))

  const enEspera = formulario.materia
    ? solicitudes.filter((s) => !s.esMia && !s.aceptada && s.materia === formulario.materia).length
    : 0

  function cambiar(campo, valor) {
    setFormulario({ ...formulario, [campo]: valor })
  }

  function alternar(clave) {
    setAbierta(abierta === clave ? null : clave)
  }

  function publicar(e) {
    e.preventDefault()

    agregarAsesoria({
      materia: formulario.materia,
      descripcion: formulario.descripcion,
      cupos: Number(formulario.cupos),
      ...datosDeSesion(formulario),
    })

    setFormulario(formularioVacio)
    setMostrarFormulario(false)
  }

  // Abre (o cierra) el formulario de respuesta con el horario que sugirió el estudiante.
  function abrirRespuesta(solicitud) {
    if (respondiendo?.id === solicitud.id) return setRespondiendo(null)
    const [inicio, fin] = (solicitud.sugeridaHorario || '').split(' - ')
    setRespondiendo({
      id: solicitud.id,
      ...sesionVacia,
      fecha: solicitud.sugeridaFecha || '',
      inicio: solicitud.sugeridaFecha ? inicio : '',
      fin: solicitud.sugeridaFecha ? fin : '',
    })
  }

  async function responder(agendaDirecto) {
    const sesion = datosDeSesion(respondiendo)
    const bien = agendaDirecto
      ? await aceptarSolicitud(respondiendo.id, {
          virtual: sesion.virtual,
          lugar: sesion.lugar,
          enlace: sesion.enlace,
        })
      : await proponerHorario(respondiendo.id, sesion)
    if (bien) setRespondiendo(null)
  }

  function formularioPara(solicitud) {
    return (
      respondiendo?.id === solicitud.id && (
        <FormularioRespuesta
          solicitud={solicitud}
          valor={respondiendo}
          cambiar={(campo, valor) => setRespondiendo({ ...respondiendo, [campo]: valor })}
          enviar={responder}
          cerrar={() => setRespondiendo(null)}
        />
      )
    )
  }

  function guardarEdicion(e) {
    e.preventDefault()
    editarAsesoria(editando.id, datosDeSesion(editando))
    setEditando(null)
  }

  function cancelar(asesoria) {
    const aviso = '¿Cancelar la asesoría? Se avisará a los ' + asesoria.asistentes.length + ' inscritos.'
    if (asesoria.asistentes.length === 0 || window.confirm(aviso)) {
      eliminarAsesoria(asesoria.id)
    }
  }

  const claseTarjeta = 'bg-tarjeta border border-borde rounded-2xl p-5'
  const claseEtiqueta = 'text-xs font-semibold tracking-wider text-zinc-400'
  const claseBotonLleno = 'bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg'
  const rolEtiqueta = { docente: 'DOCENTE', admin: 'ADMINISTRADOR' }[yo.rol] || 'MENTOR VOLUNTARIO'

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-wider border border-zinc-600 rounded-full px-3 py-1">
            {rolEtiqueta}
          </span>
          <h1 className="text-2xl font-bold mt-3">Bienvenido, {yo.nombre}</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Tienes {programadas} {programadas === 1 ? 'asesoría programada' : 'asesorías programadas'} y{' '}
            {pendientes.length} {pendientes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}.
            {sinEnlace > 0 && (
              <span className="text-acento">
                {' '}
                {sinEnlace === 1 ? 'Una sesión virtual aún no tiene enlace.' : sinEnlace + ' sesiones virtuales aún no tienen enlace.'}
              </span>
            )}
          </p>
          {sinMaterias && (
            <p className="text-sm text-acento bg-primario/10 border border-primario/30 rounded-xl px-4 py-3 mt-3 max-w-xl">
              Aún no tienes materias asignadas, así que no puedes atender solicitudes ni publicar asesorías. Pídele a tu
              coordinador que te asigne las materias que puedes atender.
            </p>
          )}
          {alcance?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-xs text-zinc-500 mr-1">Tus materias asignadas:</span>
              {alcance.map((materia) => (
                <span key={materia} className="text-[11px] text-zinc-200 bg-tarjeta border border-borde rounded-md px-2 py-0.5">
                  {materia}
                </span>
              ))}
            </div>
          )}
        </div>
        <motion.button
          {...toque}
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          disabled={sinMaterias}
          title={sinMaterias ? 'Necesitas materias asignadas para publicar' : undefined}
          className="shrink-0 self-start lg:self-auto flex items-center gap-2 bg-primario hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold px-4 py-2 rounded-full"
        >
          <motion.span animate={{ rotate: mostrarFormulario ? 135 : 0 }}>
            <CalendarPlus size={16} />
          </motion.span>
          Nueva Disponibilidad
        </motion.button>
      </div>

      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10"
          >
            <form onSubmit={publicar} className={claseCaja + ' mt-6'}>
              <div className="md:col-span-2">
                <SelectorMateria
                  catalogo={catalogoPropio}
                  value={formulario.materia}
                  onChange={(materia) => cambiar('materia', materia)}
                  className={claseCampo}
                />
              </div>
              {enEspera > 0 && (
                <p className="md:col-span-2 text-xs text-acento">
                  {enEspera === 1
                    ? '1 estudiante ha pedido esta materia. Se le'
                    : enEspera + ' estudiantes han pedido esta materia. Se les'}{' '}
                  avisará al publicar.
                </p>
              )}
              <textarea
                required
                value={formulario.descripcion}
                onChange={(e) => cambiar('descripcion', e.target.value)}
                placeholder="Temas que vas a cubrir"
                rows={2}
                className={claseCampo + ' md:col-span-2'}
              />
              <CamposSesion valor={formulario} cambiar={cambiar} className={claseCampo} />
              <input
                required
                type="number"
                min="1"
                value={formulario.cupos}
                onChange={(e) => cambiar('cupos', e.target.value)}
                placeholder="Cupos"
                className={claseCampo}
              />
              <motion.button {...toque} className={claseBotonLleno + ' justify-self-end'}>
                Publicar asesoría
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={lista}
        initial="oculto"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
      >
        <motion.div variants={item} whileHover={{ y: -4 }} className={claseTarjeta}>
          <div className="inline-block bg-zinc-800 rounded-full p-2 text-acento">
            <Users size={16} />
          </div>
          <p className={claseEtiqueta + ' mt-3 mb-2'}>ESTUDIANTES AYUDADOS</p>
          <AnimatedCounter value={estudiantes} animateOnView />
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -4 }} className={claseTarjeta}>
          <div className="inline-block bg-zinc-800 rounded-full p-2 text-acento">
            <Clock size={16} />
          </div>
          <p className={claseEtiqueta + ' mt-3 mb-2'}>HORAS IMPARTIDAS</p>
          <AnimatedCounter value={horas} decimals={1} animateOnView />
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -4 }} className={claseTarjeta + ' md:col-span-2'}>
          {tendencia.length > 1 ? (
            <Sparkline
              label="Calificación promedio"
              data={tendencia}
              labels={valoradas.map((sesion) => fechaCorta(sesion.fecha))}
              value={calificacion + ' / 5'}
              change={todasLasValoraciones.length + ' reseñas'}
              height={64}
              width={320}
            />
          ) : (
            <div>
              <p className={claseEtiqueta}>CALIFICACIÓN PROMEDIO</p>
              <p className="text-3xl font-medium mt-6">
                {calificacion || '—'}
                <span className="text-base text-acento"> / 5</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2">La tendencia aparece con dos sesiones valoradas o más.</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-x-10 gap-y-10 mt-10">
        <div className="xl:col-span-2 space-y-10">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Solicitudes disponibles</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                {pendientes.length}
              </span>
            </div>

            {pendientes.length === 0 && (
              <p className="text-sm text-zinc-500 bg-tarjeta border border-dashed border-borde rounded-xl p-5">
                No hay solicitudes pendientes{alcance !== null ? ' de tus materias' : ''}.
              </p>
            )}
            {alcance !== null && !sinMaterias && fueraDeAlcance > 0 && (
              <p className="text-xs text-zinc-500 mb-3">
                Ves solo las solicitudes de tus materias asignadas ({fueraDeAlcance} de otras materias quedan para otros mentores).
              </p>
            )}

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pendientes.map((solicitud) => {
                  const urgente = solicitud.urgencia === urgencias[0]

                  return (
                    <motion.div
                      key={solicitud.id}
                      layout
                      variants={item}
                      initial="oculto"
                      animate="visible"
                      exit="salida"
                      className={
                        'bg-tarjeta border border-borde border-l-4 rounded-xl p-4 ' +
                        (urgente ? 'border-l-primario' : 'border-l-zinc-600')
                      }
                    >
                      <div className="flex items-center gap-4">
                      <div className="shrink-0 size-11 rounded-lg bg-zinc-800 text-acento flex items-center justify-center">
                        <BookOpen size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold">{solicitud.materia}</p>
                        <p className="text-sm text-zinc-400 mt-0.5">{solicitud.tema}</p>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          <span className={claseDato}>
                            <UserRound size={13} className="text-zinc-400" />
                            {solicitud.estudiante}
                          </span>
                          <span className={claseDato}>
                            <CalendarDays size={13} className="text-zinc-400" />
                            {hace(solicitud.creada)}
                          </span>
                          <span className={claseDato + (urgente ? ' !text-acento !border-primario/40' : '')}>
                            <Clock size={13} className="text-acento" />
                            {solicitud.urgencia}
                          </span>
                          <span className={claseDato}>
                            <Users size={13} className="text-zinc-400" />
                            {solicitud.companeros > 0 ? 'Grupal · hasta ' + (solicitud.companeros + 1) + ' estudiantes' : 'Individual'}
                          </span>
                          {horarioSugerido(solicitud) && (
                            <span className={claseDato + ' !text-white !border-primario/40'}>
                              <CalendarClock size={13} className="text-acento" />
                              Sugiere: {horarioSugerido(solicitud)}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.button
                        {...toque}
                        onClick={() => abrirRespuesta(solicitud)}
                        className="shrink-0 bg-primario hover:bg-red-700 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                      >
                        {respondiendo?.id === solicitud.id ? 'Cerrar' : 'Responder'}
                      </motion.button>
                      </div>
                      {formularioPara(solicitud)}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold">Programadas</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                {programadas}
              </span>
            </div>

            {programadas === 0 && (
              <p className="text-sm text-zinc-500 bg-tarjeta border border-dashed border-borde rounded-xl p-5">
                No tienes nada programado. Publica una disponibilidad o acepta una solicitud.
              </p>
            )}

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {proximas.map((asesoria) => {
                  const clave = 'a-' + asesoria.id
                  const faltaEnlace = asesoria.virtual && !asesoria.enlace

                  return (
                    <CajaClicable
                      key={clave}
                      layout
                      variants={item}
                      initial="oculto"
                      animate="visible"
                      exit="salida"
                      onClick={() => abrirDetalle(asesoria.id)}
                      className="bg-tarjeta border border-borde border-l-4 border-l-primario rounded-xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 bg-fondo border border-borde rounded-xl px-3 py-2 text-center">
                          <p className="text-[10px] font-semibold text-acento">{mesDe(asesoria.fecha)}</p>
                          <p className="text-xl font-bold leading-tight">{diaDe(asesoria.fecha)}</p>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold">{asesoria.materia}</span>
                            {asesoria.privada && <span className={insignia}>INDIVIDUAL</span>}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2.5">
                            <span className={claseDato}>
                              <Clock size={13} className="text-acento" />
                              {asesoria.horario}
                            </span>
                            <span className={claseDato + (faltaEnlace ? ' !text-acento !border-primario/40' : '')}>
                              {asesoria.virtual ? (
                                <Video size={13} className="text-acento" />
                              ) : (
                                <MapPin size={13} className="text-acento" />
                              )}
                              {modalidadDe(asesoria)}
                            </span>
                            <span className={claseDato}>
                              <UserRound size={13} className="text-zinc-400" />
                              {asesoria.privada
                                ? asesoria.asistentes[0]?.nombre
                                : asesoria.asistentes.length + '/' + asesoria.cupos + ' inscritos'}
                            </span>
                            {asesoria.virtual && asesoria.enlace && (
                              <a
                                href={asesoria.enlace}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center text-xs font-semibold bg-primario hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors"
                              >
                                Abrir reunión
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <ChevronRight size={18} className="text-zinc-500" />
                          <button
                            onClick={() =>
                              setEditando(editando?.id === asesoria.id ? null : { id: asesoria.id, ...sesionDe(asesoria) })
                            }
                            className={claseAccion + (faltaEnlace ? ' !text-acento' : '')}
                          >
                            {faltaEnlace ? 'Agregar enlace' : 'Editar'}
                          </button>
                          <button onClick={() => cancelar(asesoria)} className={claseAccion + ' hover:!text-acento'}>
                            Cancelar
                          </button>
                        </div>
                      </div>

                      {!asesoria.privada && (
                        <div className="mt-3 ml-[4.25rem]">
                          <Detalle abierta={abierta} alternar={alternar} clave={clave} texto="Ver inscritos" />
                        </div>
                      )}

                      <Despliegue abierta={abierta} clave={clave}>
                        <div className="ml-[4.25rem]">
                          <Asistentes personas={asesoria.asistentes} />
                        </div>
                      </Despliegue>

                      {editando?.id === asesoria.id && (
                        <form onSubmit={guardarEdicion} className={claseCaja + ' mt-4 bg-fondo'}>
                          <CamposSesion
                            valor={editando}
                            cambiar={(campo, valor) => setEditando({ ...editando, [campo]: valor })}
                            className={claseCampo + ' bg-tarjeta'}
                          />
                          <p className="md:col-span-2 text-xs text-zinc-500">
                            Los estudiantes inscritos recibirán un aviso con los cambios.
                          </p>
                          <div className="md:col-span-2 flex justify-end gap-4 items-center">
                            <button type="button" onClick={() => setEditando(null)} className={claseAccion}>
                              Cerrar
                            </button>
                            <motion.button {...toque} className={claseBotonLleno}>
                              Guardar cambios
                            </motion.button>
                          </div>
                        </form>
                      )}
                    </CajaClicable>
                  )
                })}

                {porAgendar.map((solicitud) => (
                  <motion.div
                    key={'s-' + solicitud.id}
                    layout
                    variants={item}
                    initial="oculto"
                    animate="visible"
                    exit="salida"
                    className="bg-tarjeta border border-borde border-l-4 border-l-emerald-500 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 size-11 rounded-lg bg-zinc-800 text-acento flex items-center justify-center">
                        <CalendarPlus size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold">{solicitud.materia}</span>
                          <span className={insignia + 'text-acento !border-primario/40 bg-primario/10'}>
                            POR AGENDAR
                          </span>
                        </p>
                        <p className="text-sm text-zinc-400 mt-0.5">{solicitud.tema}</p>
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          <span className={claseDato}>
                            <UserRound size={13} className="text-zinc-400" />
                            {solicitud.estudiante}
                          </span>
                          <span className={claseDato}>
                            <Clock size={13} className="text-acento" />
                            {solicitud.urgencia}
                          </span>
                          <span className={claseDato}>
                            <Users size={13} className="text-zinc-400" />
                            {solicitud.companeros > 0 ? 'Grupal · hasta ' + (solicitud.companeros + 1) + ' estudiantes' : 'Individual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-4 mt-4">
                      <button onClick={() => liberarSolicitud(solicitud.id)} className={claseAccion}>
                        Soltar
                      </button>
                      <button
                        onClick={() => atenderSolicitud(solicitud.id)}
                        title="Ya la resolviste sin una sesión programada"
                        className={claseAccion}
                      >
                        Marcar atendida
                      </button>
                      <motion.button
                        {...toque}
                        onClick={() => abrirRespuesta(solicitud)}
                        className="bg-primario hover:bg-red-700 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                      >
                        {horarioSugerido(solicitud) ? 'Agendar o proponer' : 'Proponer horario'}
                      </motion.button>
                    </div>

                    {formularioPara(solicitud)}

                  </motion.div>
                ))}

                {esperando.map((solicitud) => {
                  const p = solicitud.propuesta
                  return (
                    <motion.div
                      key={'p-' + solicitud.id}
                      layout
                      variants={item}
                      initial="oculto"
                      animate="visible"
                      exit="salida"
                      className="bg-tarjeta border border-borde border-l-4 border-l-amber-500 rounded-xl p-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 size-11 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center">
                          <Hourglass size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold">{solicitud.materia}</span>
                            <span className={insignia + '!text-amber-400 !border-amber-500/40 !bg-amber-500/10'}>
                              ESPERANDO AL ESTUDIANTE
                            </span>
                          </p>
                          <p className="text-sm text-zinc-400 mt-0.5">{solicitud.tema}</p>
                          <div className="flex flex-wrap gap-2 mt-2.5">
                            <span className={claseDato}>
                              <UserRound size={13} className="text-zinc-400" />
                              {solicitud.estudiante}
                            </span>
                            <span className={claseDato + ' !text-white !border-amber-500/40'}>
                              <CalendarClock size={13} className="text-amber-400" />
                              Propusiste: {fechaCorta(p.fecha)}, {p.horario} · {p.virtual ? 'Virtual' : p.lugar}
                            </span>
                            {horarioSugerido(solicitud) && (
                              <span className={claseDato + ' text-zinc-500'}>Había sugerido: {horarioSugerido(solicitud)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <button onClick={() => liberarSolicitud(solicitud.id)} className={claseAccion + ' hover:!text-acento'}>
                          Retirar propuesta
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </section>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold">Historial</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
              {historial.length}
            </span>
          </div>

          {historial.length === 0 && (
            <p className="text-sm text-zinc-500 bg-tarjeta border border-dashed border-borde rounded-xl p-5">
              Aquí quedará el registro de tus sesiones, asistentes y reseñas.
            </p>
          )}

          <div className="space-y-3">
            {(verTodo ? historial : historial.slice(0, LIMITE_HISTORIAL)).map((registro) => {
              const { asesoria, solicitud } = registro

              if (solicitud) {
                return (
                  <div
                    key={registro.clave}
                    className="bg-tarjeta border border-borde border-l-4 border-l-zinc-600 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold">{solicitud.materia}</p>
                      <p className="text-xs text-zinc-500 shrink-0">{fechaCorta(registro.fecha)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <span className={claseDato}>
                        <UserRound size={13} className="text-zinc-400" />
                        {solicitud.estudiante}
                      </span>
                      <span className={claseDato}>Atención individual</span>
                    </div>
                  </div>
                )
              }

              const valores = asesoria.asistentes.filter((p) => p.valoracion).map((p) => p.valoracion)
              const media = promedio(valores)
              const borrador = resumenes[asesoria.id] ?? asesoria.resumen ?? ''
              const sinCambios = borrador.trim() === (asesoria.resumen || '')

              return (
                <CajaClicable
                  key={registro.clave}
                  onClick={() => abrirDetalle(asesoria.id)}
                  className="bg-tarjeta border border-borde border-l-4 border-l-zinc-600 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold">{asesoria.materia}</p>
                    <p className="text-xs text-zinc-500 shrink-0">{fechaCorta(registro.fecha)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2.5">
                    <span className={claseDato}>
                      <UserRound size={13} className="text-zinc-400" />
                      {asesoria.privada
                        ? asesoria.asistentes[0]?.nombre || 'Estudiante'
                        : asesoria.asistentes.length + ' asistentes'}
                    </span>
                    <span className={claseDato}>
                      <Clock size={13} className="text-zinc-400" />
                      {horasDe(asesoria.horario).toFixed(1)} h
                    </span>
                    {media && (
                      <span className={claseDato + ' !text-acento'}>
                        <Star size={13} className="fill-acento" />
                        {media}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3">
                    <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {asesoria.resumen ? (
                        <span className="text-emerald-400">Retroalimentación enviada</span>
                      ) : (
                        <span className="text-acento">Falta retroalimentación</span>
                      )}
                      {asesoria.asistentes.some((p) => p.asistio === null) && (
                        <span className="text-acento">Falta registrar asistencia</span>
                      )}
                    </span>
                    <Detalle abierta={abierta} alternar={alternar} clave={registro.clave} texto="Reseñas" />
                  </div>

                  <Despliegue abierta={abierta} clave={registro.clave}>
                    <Asistentes personas={asesoria.asistentes} conValoracion />
                    <div className="pt-4">
                      <p className="text-xs text-zinc-500 mb-1.5">
                        Retroalimentación para {asesoria.privada ? 'el estudiante' : 'los estudiantes'}
                      </p>
                      <textarea
                        value={borrador}
                        onChange={(e) => setResumenes({ ...resumenes, [asesoria.id]: e.target.value })}
                        rows={3}
                        placeholder="Temas vistos, avances y recomendaciones para seguir."
                        className={claseCampo + ' w-full text-xs'}
                      />
                      <div className="flex justify-end mt-2">
                        <motion.button
                          {...toque}
                          disabled={borrador.trim() === '' || sinCambios}
                          onClick={() => guardarResumen(asesoria.id, borrador)}
                          className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-md px-3 py-1 text-xs font-semibold"
                        >
                          {asesoria.resumen ? 'Actualizar' : 'Guardar y avisar'}
                        </motion.button>
                      </div>
                    </div>
                  </Despliegue>
                </CajaClicable>
              )
            })}
          </div>

          {historial.length > LIMITE_HISTORIAL && (
            <button onClick={() => setVerTodo(!verTodo)} className={claseAccion + ' mt-3'}>
              {verTodo ? 'Ver menos' : 'Ver todo (' + historial.length + ')'}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}

export default PortalMentores
