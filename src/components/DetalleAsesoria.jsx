import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { X, Video, MapPin, CalendarPlus } from 'lucide-react'
import Estrellas from './Estrellas.jsx'
import Valoracion from './Valoracion.jsx'
import { sesionDe, datosDeSesion } from './CamposSesion.jsx'
import { fechaLarga, fechaCorta, horasDe, hace } from '../fechas.js'
import { toque } from '../animaciones.js'

function Dato({ etiqueta, children }) {
  return (
    <div className="flex gap-4 py-2.5">
      <dt className="w-24 shrink-0 text-xs text-zinc-500 pt-0.5">{etiqueta}</dt>
      <dd className="text-sm min-w-0 break-words">{children}</dd>
    </div>
  )
}

function Seccion({ titulo, children }) {
  return (
    <section className="mt-7">
      <h3 className="text-xs font-semibold tracking-wider text-zinc-500 mb-2">{titulo}</h3>
      {children}
    </section>
  )
}

// Abre el evento en Google Calendar con los datos de la asesoría ya cargados.
function enlaceCalendario(asesoria) {
  const [inicio, fin] = asesoria.horario.split(' - ')
  const dia = asesoria.fecha.replaceAll('-', '')
  const hora = (texto) => texto.replace(':', '') + '00'

  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: asesoria.materia + ' · PERMANECE+',
    dates: dia + 'T' + hora(inicio) + '/' + dia + 'T' + hora(fin),
    ctz: 'America/Bogota',
    details: asesoria.descripcion + (asesoria.enlace ? '\n' + asesoria.enlace : ''),
    location: asesoria.virtual ? asesoria.enlace || 'Virtual' : asesoria.lugar,
  })
  return 'https://calendar.google.com/calendar/render?' + parametros.toString()
}

// Panel con toda la información de una asesoría. Cambia según quién la mira: su mentor, un inscrito o alguien del banco.
function DetalleAsesoria({
  asesoria,
  solicitud,
  cerrar,
  inscribir,
  cancelarInscripcion,
  valorar,
  editarAsesoria,
  eliminarAsesoria,
  guardarResumen,
  marcarAsistencia,
}) {
  const [enlace, setEnlace] = useState(asesoria.enlace || '')
  const [resumen, setResumen] = useState(asesoria.resumen || '')

  useEffect(() => {
    function alTeclear(e) {
      if (e.key === 'Escape') cerrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [cerrar])

  const { esMia, inscrita, pasada, privada, virtual } = asesoria
  const asistentes = asesoria.asistentes || []
  const puedeInscribirse = !esMia && !inscrita && !pasada && !privada && asesoria.inscritos < asesoria.cupos
  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'

  function guardarEnlace() {
    editarAsesoria(asesoria.id, datosDeSesion({ ...sesionDe(asesoria), enlace }))
  }

  function cancelar() {
    const aviso = '¿Cancelar la asesoría? Se avisará a los ' + asistentes.length + ' inscritos.'
    if (asistentes.length === 0 || window.confirm(aviso)) {
      eliminarAsesoria(asesoria.id)
      cerrar()
    }
  }

  const etapas = []
  if (solicitud) {
    etapas.push('Solicitada ' + hace(solicitud.creada) + ' por ' + solicitud.estudiante + ' · ' + solicitud.urgencia)
    if (solicitud.mentor) etapas.push('Aceptada por ' + solicitud.mentor)
    etapas.push('Agendada para el ' + fechaCorta(asesoria.fecha))
    if (pasada) etapas.push('Realizada')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={cerrar}
        className="fixed inset-0 z-40 bg-black/60"
      />
      <motion.aside
        initial={{ x: 48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 48, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        role="dialog"
        aria-label={'Detalle de ' + asesoria.materia}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-tarjeta border-l border-borde overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex flex-wrap gap-2 text-[10px] font-bold tracking-wide">
                <span className={'px-2.5 py-0.5 rounded-full ' + (pasada ? 'bg-zinc-800 text-zinc-400' : 'bg-primario/20 text-acento')}>
                  {pasada ? 'REALIZADA' : 'PRÓXIMA'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {privada ? 'INDIVIDUAL' : 'GRUPAL'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {virtual ? 'VIRTUAL' : 'PRESENCIAL'}
                </span>
              </p>
              <h2 className="text-xl font-bold mt-3">{asesoria.materia}</h2>
            </div>
            <button onClick={cerrar} title="Cerrar" className="shrink-0 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <dl className="mt-5 divide-y divide-borde border-y border-borde">
            <Dato etiqueta="Fecha">{fechaLarga(asesoria.fecha)}</Dato>
            <Dato etiqueta="Horario">
              {asesoria.horario}{' '}
              <span className="text-zinc-500">({horasDe(asesoria.horario).toFixed(1)} h)</span>
            </Dato>
            <Dato etiqueta={virtual ? 'Reunión' : 'Lugar'}>
              {virtual ? (
                asesoria.enlace ? (
                  <a
                    href={asesoria.enlace}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-acento font-medium hover:underline break-all"
                  >
                    <Video size={15} className="shrink-0" />
                    Entrar a la reunión
                  </a>
                ) : (
                  <span className="text-zinc-400">El mentor compartirá el enlace</span>
                )
              ) : (
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-acento shrink-0" />
                  {asesoria.lugar}
                </span>
              )}
            </Dato>
            <Dato etiqueta={asesoria.tipo === 'Docente' ? 'Docente' : 'Mentor'}>
              {asesoria.tutor} <span className="text-zinc-500">· {asesoria.rol}</span>
            </Dato>
            <Dato etiqueta="Área">{asesoria.area}</Dato>
            {!privada && (
              <Dato etiqueta="Cupos">
                {asesoria.inscritos}/{asesoria.cupos} inscritos
              </Dato>
            )}
          </dl>

          <Seccion titulo="TEMAS">
            <p className="text-sm text-zinc-300">{asesoria.descripcion}</p>
          </Seccion>

          {etapas.length > 0 && (
            <Seccion titulo="SEGUIMIENTO">
              <ol className="space-y-2">
                {etapas.map((etapa, posicion) => (
                  <li key={posicion} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <span className="size-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    {etapa}
                  </li>
                ))}
              </ol>
            </Seccion>
          )}

          {inscrita && pasada && (
            <Seccion titulo="RETROALIMENTACIÓN Y VALORACIÓN">
              <p className="text-xs text-zinc-500 mb-3">
                Asistencia registrada por el mentor:{' '}
                <span
                  className={
                    asesoria.miAsistio === true
                      ? 'text-emerald-400'
                      : asesoria.miAsistio === false
                        ? 'text-acento'
                        : 'text-zinc-400'
                  }
                >
                  {asesoria.miAsistio === true ? 'asististe' : asesoria.miAsistio === false ? 'no asististe' : 'sin registrar'}
                </span>
              </p>
              {asesoria.resumen ? (
                <p className="text-sm text-zinc-300">
                  <span className="text-zinc-500">{asesoria.tutor}: </span>
                  {asesoria.resumen}
                </p>
              ) : (
                <p className="text-sm text-zinc-500">El mentor aún no deja retroalimentación.</p>
              )}
              <div className="mt-4 max-w-xs">
                <p className="text-xs text-zinc-500 mb-1.5">Tu valoración</p>
                <Valoracion asesoria={asesoria} valorar={valorar} />
              </div>
            </Seccion>
          )}

          {esMia && (
            <>
              <Seccion titulo={privada ? 'ESTUDIANTE' : 'INSCRITOS'}>
                {asistentes.length === 0 ? (
                  <p className="text-sm text-zinc-500">Aún no hay inscritos.</p>
                ) : (
                  <ul className="space-y-3">
                    {asistentes.map((persona, posicion) => (
                      <li key={posicion} className="text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span>{persona.nombre}</span>
                          {pasada &&
                            (persona.valoracion ? (
                              <Estrellas cantidad={persona.valoracion} />
                            ) : (
                              <span className="text-xs text-zinc-600">Sin valorar</span>
                            ))}
                        </div>
                        {pasada && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-zinc-500 mr-1">Asistencia:</span>
                            {[
                              { valor: true, texto: 'Asistió' },
                              { valor: false, texto: 'No asistió' },
                            ].map((opcion) => (
                              <button
                                key={opcion.texto}
                                onClick={() => marcarAsistencia(asesoria.id, persona.id, opcion.valor)}
                                className={
                                  'text-xs font-semibold px-3 py-1 rounded-full border transition-colors ' +
                                  (persona.asistio === opcion.valor
                                    ? opcion.valor
                                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                      : 'bg-primario/15 border-primario/40 text-acento'
                                    : 'border-borde text-zinc-400 hover:text-white')
                                }
                              >
                                {opcion.texto}
                              </button>
                            ))}
                            {persona.asistio === null && (
                              <span className="text-xs text-zinc-600">Sin registrar</span>
                            )}
                          </div>
                        )}
                        {persona.comentario && (
                          <p className="text-xs italic text-zinc-500 mt-1">"{persona.comentario}"</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Seccion>

              {!pasada && virtual && (
                <Seccion titulo="ENLACE DE LA REUNIÓN">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={enlace}
                      onChange={(e) => setEnlace(e.target.value)}
                      placeholder="https://..."
                      className={claseCampo + ' flex-1 min-w-0'}
                    />
                    <motion.button
                      {...toque}
                      disabled={enlace.trim() === (asesoria.enlace || '')}
                      onClick={guardarEnlace}
                      className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 text-sm font-semibold"
                    >
                      Guardar
                    </motion.button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Los inscritos reciben un aviso cuando lo agregas.</p>
                </Seccion>
              )}

              {pasada && (
                <Seccion titulo="TU RETROALIMENTACIÓN">
                  <textarea
                    value={resumen}
                    onChange={(e) => setResumen(e.target.value)}
                    rows={4}
                    placeholder="Temas vistos, avances y recomendaciones para seguir."
                    className={claseCampo + ' w-full'}
                  />
                  <div className="flex justify-end mt-2">
                    <motion.button
                      {...toque}
                      disabled={resumen.trim() === '' || resumen.trim() === (asesoria.resumen || '')}
                      onClick={() => guardarResumen(asesoria.id, resumen)}
                      className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-4 py-2 text-sm font-semibold"
                    >
                      {asesoria.resumen ? 'Actualizar' : 'Guardar y avisar'}
                    </motion.button>
                  </div>
                </Seccion>
              )}
            </>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!pasada && (
              <a
                href={enlaceCalendario(asesoria)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-borde hover:bg-zinc-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                <CalendarPlus size={16} />
                Agregar a mi calendario
              </a>
            )}
            {puedeInscribirse && (
              <motion.button
                {...toque}
                onClick={() => inscribir(asesoria.id)}
                className="bg-primario hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Inscribirme
              </motion.button>
            )}
            {inscrita && !pasada && !privada && (
              <button
                onClick={() => cancelarInscripcion(asesoria.id)}
                className="text-sm font-medium text-zinc-400 hover:text-acento transition-colors"
              >
                Cancelar inscripción
              </button>
            )}
            {esMia && !pasada && (
              <button
                onClick={cancelar}
                className="text-sm font-medium text-zinc-400 hover:text-acento transition-colors"
              >
                Cancelar asesoría
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default DetalleAsesoria
