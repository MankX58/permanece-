import { motion } from 'motion/react'
import { Video } from 'lucide-react'
import CajaClicable from '../components/CajaClicable.jsx'
import Pendientes from '../components/Pendientes.jsx'
import Plegable from '../components/Plegable.jsx'
import { EnLinea } from '../components/Resumen.jsx'
import { fechaCorta, horasDe, promedio } from '../fechas.js'
import { toque } from '../animaciones.js'

// Panel principal del docente: lo que da, lo que le piden y lo que le falta cerrar.
function PanelMentor({ yo, asesorias, solicitudes, setPagina, abrirDetalle }) {
  const mias = asesorias.filter((asesoria) => asesoria.esMia)
  const proximas = mias.filter((asesoria) => !asesoria.pasada)
  const impartidas = mias.filter((asesoria) => asesoria.pasada)
  const alcance = yo.materiasAsignadas ?? null
  const sinMaterias = Array.isArray(alcance) && alcance.length === 0

  const pendientes = solicitudes.filter(
    (solicitud) => !solicitud.esMia && !solicitud.aceptada && (alcance === null || alcance.includes(solicitud.materia))
  ).length
  const sinEnlace = proximas.filter((asesoria) => asesoria.virtual && !asesoria.enlace).length
  const sinAsistencia = impartidas.filter((asesoria) => asesoria.asistentes?.some((p) => p.asistio === null)).length
  const sinRetro = impartidas.filter((asesoria) => !asesoria.resumen && asesoria.asistentes?.length > 0).length

  const atendidas = solicitudes.filter((solicitud) => solicitud.aceptadaPorMi && solicitud.atendida).length
  const estudiantes = impartidas.reduce((total, asesoria) => total + asesoria.asistentes.length, atendidas)
  const horas = impartidas.reduce((total, asesoria) => total + horasDe(asesoria.horario), 0)
  const calificacion = promedio(impartidas.flatMap((asesoria) => asesoria.asistentes.filter((p) => p.valoracion).map((p) => p.valoracion)))

  const proxima = proximas[0]
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios)

  const items = [
    sinMaterias && { texto: 'Aún no tienes materias asignadas, así que no puedes atender solicitudes. Pídeselas a tu coordinador.' },
    pendientes > 0 && {
      texto: plural(pendientes, 'solicitud de tus materias espera', 'solicitudes de tus materias esperan') + ' tu respuesta',
      boton: 'Responder',
      destino: 'mentores',
    },
    sinEnlace > 0 && {
      texto: plural(sinEnlace, 'sesión virtual sin enlace', 'sesiones virtuales sin enlace'),
      boton: 'Agregar enlace',
      destino: 'mentores',
    },
    sinAsistencia > 0 && {
      texto: 'Falta registrar la asistencia de ' + plural(sinAsistencia, 'sesión', 'sesiones'),
      boton: 'Registrar',
      destino: 'mentores',
    },
    sinRetro > 0 && {
      texto: 'Falta la retroalimentación de ' + plural(sinRetro, 'sesión', 'sesiones'),
      boton: 'Escribir',
      destino: 'mentores',
    },
  ].filter(Boolean)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-red-400">Hola, {yo.nombre.split(' ')[0]}</h1>
      <EnLinea
        className="mt-2"
        datos={[
          { valor: estudiantes, etiqueta: 'estudiantes ayudados' },
          { valor: horas.toFixed(1), etiqueta: 'horas impartidas' },
          { valor: calificacion ? calificacion + ' /5' : '—', etiqueta: 'calificación promedio' },
        ]}
      />

      <CajaClicable
        onClick={proxima ? () => abrirDetalle(proxima.id) : undefined}
        className="bg-primario/10 rounded-2xl p-5 mt-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs text-red-300">Tu próxima sesión</p>
          {proxima ? (
            <>
              <p className="text-lg font-semibold mt-1">{proxima.materia}</p>
              <p className="text-sm text-zinc-400">
                {fechaCorta(proxima.fecha)}, {proxima.horario} · {proxima.lugar} · {proxima.inscritos}/{proxima.cupos} inscritos
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-400 mt-1">No tienes asesorías programadas.</p>
          )}
        </div>
        {proxima?.virtual && proxima.enlace ? (
          <motion.a
            {...toque}
            href={proxima.enlace}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center justify-center gap-2 bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg"
          >
            <Video size={16} />
            Abrir la reunión
          </motion.a>
        ) : (
          !proxima && (
            <motion.button
              {...toque}
              onClick={() => setPagina('mentores')}
              className="shrink-0 bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg"
            >
              Publicar disponibilidad
            </motion.button>
          )
        )}
      </CajaClicable>

      <Pendientes items={items} irA={setPagina} className="mt-8" />

      <Plegable
        titulo="Próximas sesiones"
        cantidad={proximas.length}
        claseTitulo="text-base font-semibold"
        className="mt-8"
        acciones={
          <button onClick={() => setPagina('mentores')} className="text-xs text-red-400 hover:text-red-300">
            Ir al portal de mentores
          </button>
        }
      >
        {proximas.length === 0 ? (
          <p className="text-sm text-zinc-400 bg-tarjeta rounded-2xl p-5">No tienes sesiones programadas.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {proximas.map((sesion) => (
              <button
                key={sesion.id}
                onClick={() => abrirDetalle(sesion.id)}
                className="text-left bg-tarjeta hover:bg-zinc-900 transition-colors rounded-xl p-4"
              >
                <p className="text-xs text-red-400">
                  {fechaCorta(sesion.fecha)}, {sesion.horario}
                </p>
                <p className="text-sm font-semibold mt-1">{sesion.materia}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {sesion.inscritos} de {sesion.cupos} inscritos · {sesion.virtual ? 'Virtual' : sesion.lugar}
                </p>
              </button>
            ))}
          </div>
        )}
      </Plegable>
    </div>
  )
}

export default PanelMentor
