import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import { CircleCheck, CircleAlert } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import Cargando from './components/Cargando.jsx'
import Login from './pages/Login.jsx'
import PanelPrincipal from './pages/PanelPrincipal.jsx'
import BancoAsesorias from './pages/BancoAsesorias.jsx'
import MisSolicitudes from './pages/MisSolicitudes.jsx'
import PortalMentores from './pages/PortalMentores.jsx'
import Usuarios from './pages/Usuarios.jsx'
import CentroAyuda from './pages/CentroAyuda.jsx'
import Calendario from './pages/Calendario.jsx'
import Reportes from './pages/Reportes.jsx'
import Materias from './pages/Materias.jsx'
import EspecialidadMentores from './pages/EspecialidadMentores.jsx'
import DetalleAsesoria from './components/DetalleAsesoria.jsx'
import Introduccion from './components/Introduccion.jsx'
import ElegirCarrera from './components/ElegirCarrera.jsx'
import { useApi } from './useApi.js'

function App() {
  const { isLoading, isAuthenticated } = useAuth0()
  const api = useApi()

  const [pagina, setPagina] = useState('panel')
  const [busquedaBanco, setBusquedaBanco] = useState('')
  const [detalleId, setDetalleId] = useState(null)
  const [datos, setDatos] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState(null)
  // Error de la carga inicial: a diferencia del aviso flotante, no se borra solo, para que la pantalla
  // de carga lo siga mostrando (con la opción de cerrar sesión) hasta que la persona actúe.
  const [errorCarga, setErrorCarga] = useState(null)
  const [verIntroduccion, setVerIntroduccion] = useState(false)
  const [introVistaLocal, setIntroVistaLocal] = useState(null)
  const inicioHecho = useRef(false)

  const cerrarDetalle = useCallback(() => setDetalleId(null), [])

  // El coordinador entra directo a sus reportes: es lo único propio de su rol.
  useEffect(() => {
    if (datos && !inicioHecho.current) {
      inicioHecho.current = true
      if (datos.yo.rol === 'coordinador') setPagina('reportes')
    }
  }, [datos])

  function irA(destino) {
    setDetalleId(null)
    setBusquedaBanco('')
    setPagina(destino)
    cargar().catch(() => {})
  }

  function verEnBanco(materia) {
    setBusquedaBanco(materia)
    setPagina('banco')
    cargar().catch(() => {})
  }

  async function cargar() {
    setDatos(await api('/datos'))
    setErrorCarga(null)
  }

  useEffect(() => {
    if (isAuthenticated) {
      cargar().catch((e) => setErrorCarga(e.message))
    }
  }, [isAuthenticated])

  // Lo que crean otros usuarios (solicitudes, inscripciones) llega sin recargar la página.
  useEffect(() => {
    if (!isAuthenticated) return

    function refrescar() {
      if (!document.hidden) {
        cargar().catch((e) => setErrorCarga(e.message))
      }
    }

    const intervalo = setInterval(refrescar, 20000)
    window.addEventListener('focus', refrescar)
    return () => {
      clearInterval(intervalo)
      window.removeEventListener('focus', refrescar)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (aviso) {
      const espera = setTimeout(() => setAviso(null), 3500)
      return () => clearTimeout(espera)
    }
  }, [aviso])

  // Devuelve si la acción salió bien, por si la página necesita limpiar un formulario.
  async function enviar(ruta, metodo, cuerpo, mensaje) {
    setOcupado(true)
    let bien = false
    try {
      await api(ruta, metodo, cuerpo)
      await cargar()
      setAviso({ texto: mensaje, error: false })
      bien = true
    } catch (e) {
      setAviso({ texto: e.message, error: true })
    }
    setOcupado(false)
    return bien
  }

  function inscribir(id) {
    enviar('/asesorias/' + id + '/inscripcion', 'POST', null, 'Quedaste inscrito.')
  }

  function cancelar(id) {
    enviar('/asesorias/' + id + '/inscripcion', 'DELETE', null, 'Inscripción cancelada.')
  }

  function agregarAsesoria(nueva) {
    enviar('/asesorias', 'POST', nueva, 'Asesoría publicada en el banco.')
  }

  function eliminarAsesoria(id) {
    enviar('/asesorias/' + id, 'DELETE', null, 'Asesoría eliminada.')
  }

  function agregarSolicitud(nueva) {
    enviar('/solicitudes', 'POST', nueva, 'Solicitud enviada.')
  }

  function eliminarSolicitud(id) {
    enviar('/solicitudes/' + id, 'DELETE', null, 'Solicitud eliminada.')
  }

  // El mentor acepta el horario que sugirió el estudiante (queda agendada) o propone otro (el estudiante decide).
  function aceptarSolicitud(id, datos) {
    return enviar('/solicitudes/' + id + '/aceptar', 'POST', datos, 'Asesoría agendada con el horario sugerido. Se avisó al estudiante.')
  }

  function proponerHorario(id, datos) {
    return enviar('/solicitudes/' + id + '/proponer', 'POST', datos, 'Propuesta enviada. El estudiante debe aceptarla.')
  }

  // El estudiante acepta la propuesta (queda agendada) o la rechaza (vuelve a estar disponible).
  function responderPropuesta(id, acepta, sugerencia = {}) {
    return enviar(
      '/solicitudes/' + id + '/responder',
      'POST',
      { acepta, ...sugerencia },
      acepta ? 'Horario aceptado: la asesoría quedó agendada.' : 'Propuesta rechazada. Tu solicitud volvió a estar disponible.'
    )
  }

  function editarAsesoria(id, datos) {
    enviar('/asesorias/' + id, 'PUT', datos, 'Asesoría actualizada.')
  }

  function guardarResumen(id, resumen) {
    enviar('/asesorias/' + id + '/resumen', 'PUT', { resumen }, 'Retroalimentación guardada y enviada.')
  }

  function atenderSolicitud(id) {
    enviar('/solicitudes/' + id + '/atender', 'POST', null, 'Solicitud marcada como atendida.')
  }

  function liberarSolicitud(id) {
    enviar('/solicitudes/' + id + '/liberar', 'POST', null, 'La solicitud volvió a estar disponible.')
  }

  function valorar(id, valoracion, comentario) {
    enviar('/asesorias/' + id + '/valoracion', 'PUT', { valoracion, comentario }, 'Valoración guardada.')
  }

  // El estudiante elige su carrera la primera vez; el admin la puede corregir.
  function elegirCarrera(carrera) {
    return enviar('/yo/carrera', 'PUT', { carrera }, 'Listo: verás las materias de ' + carrera + '.')
  }

  function cambiarCarrera(id, carrera) {
    return enviar('/usuarios/' + encodeURIComponent(id) + '/carrera', 'PUT', { carrera }, 'Carrera actualizada.')
  }

  function cambiarRol(id, rol, programa) {
    enviar('/usuarios/' + encodeURIComponent(id) + '/rol', 'PUT', { rol, programa }, 'Rol actualizado.')
  }

  function agregarMateria(carrera, materia) {
    return enviar('/materias', 'POST', { carrera, materia }, materia + ' quedó en ' + carrera + '.')
  }

  function quitarMateria(carrera, materia) {
    return enviar('/materias', 'DELETE', { carrera, materia }, materia + ' se quitó de ' + carrera + '.')
  }

  function renombrarMateria(carrera, materia, nuevo, enTodas = false) {
    return enviar('/materias', 'PUT', { carrera, materia, nuevo, enTodas }, '«' + materia + '» ahora es «' + nuevo + '».')
  }

  function asignarMateriaMentor(mentorId, materia) {
    return enviar('/mentores/' + encodeURIComponent(mentorId) + '/materias', 'POST', { materia }, materia + ' quedó asignada.')
  }

  function quitarMateriaMentor(mentorId, materia) {
    return enviar('/mentores/' + encodeURIComponent(mentorId) + '/materias', 'DELETE', { materia }, materia + ' ya no está asignada.')
  }

  function marcarAsistencia(asesoriaId, usuarioId, asistio) {
    enviar(
      '/asesorias/' + asesoriaId + '/asistencia/' + encodeURIComponent(usuarioId),
      'PUT',
      { asistio },
      'Asistencia registrada.'
    )
  }

  // Cierra la introducción y recuerda, en el servidor, que este rol ya la vio.
  function terminarIntroduccion(rol) {
    setVerIntroduccion(false)
    setIntroVistaLocal(rol)
    api('/introduccion/vista', 'POST').then(cargar).catch(() => {})
  }

  function marcarLeidas() {
    enviar('/notificaciones/leidas', 'POST', null, 'Notificaciones borradas.')
  }

  // Se quita de la lista al instante; si el servidor falla, se recarga para recuperarla.
  async function borrarNotificacion(id) {
    setDatos((actual) => ({ ...actual, notificaciones: actual.notificaciones.filter((n) => n.id !== id) }))
    try {
      await api('/notificaciones/' + id, 'DELETE')
    } catch (e) {
      setAviso({ texto: e.message, error: true })
      cargar().catch(() => {})
    }
  }

  // Abrir una notificación la borra y lleva a su detalle: una asesoría ('asesoria:ID') o una página.
  async function abrirNotificacion(notificacion) {
    await borrarNotificacion(notificacion.id)
    const [tipo, id] = notificacion.destino.split(':')
    if (tipo === 'asesoria') {
      setDetalleId(Number(id))
    } else {
      irA(tipo)
    }
  }

  if (isLoading) {
    return <Cargando />
  }

  if (!isAuthenticated) {
    return <Login />
  }

  if (!datos) {
    return <Cargando error={errorCarga} />
  }

  const { yo, asesorias, solicitudes, usuarios, notificaciones, catalogo, mentores } = datos
  const esMentor = ['mentor', 'docente', 'admin'].includes(yo.rol)
  const esAdmin = yo.rol === 'admin'
  const esCoordinador = yo.rol === 'coordinador'
  const detalle = asesorias.find((asesoria) => asesoria.id === detalleId)
  // Un estudiante sin carrera la elige antes de todo (también los que ya existían). La restricción depende del
  // rol: el estudiante pide asesorías solo de su carrera; los demás roles tienen sus propias reglas.
  const faltaCarrera = yo.rol === 'estudiante' && !yo.carrera
  const catalogoParaPedir = yo.rol === 'estudiante' ? catalogo.filter((c) => c.nombre === yo.carrera) : catalogo
  const mostrarIntroduccion =
    !faltaCarrera && (verIntroduccion || (yo.introduccionVista !== yo.rol && introVistaLocal !== yo.rol))

  let contenido
  if (pagina === 'banco') {
    contenido = (
      <BancoAsesorias
        asesorias={asesorias}
        catalogo={catalogo}
        carreraInicial={yo.rol === 'estudiante' ? yo.carrera || '' : ''}
        inscribir={inscribir}
        cancelar={cancelar}
        busquedaInicial={busquedaBanco}
        abrirDetalle={setDetalleId}
      />
    )
  } else if (pagina === 'calendario') {
    contenido = <Calendario asesorias={asesorias} abrirDetalle={setDetalleId} />
  } else if (pagina === 'solicitudes') {
    contenido = (
      <MisSolicitudes
        asesorias={asesorias}
        cancelar={cancelar}
        solicitudes={solicitudes}
        agregarSolicitud={agregarSolicitud}
        eliminarSolicitud={eliminarSolicitud}
        verEnBanco={verEnBanco}
        valorar={valorar}
        abrirDetalle={setDetalleId}
        catalogo={catalogoParaPedir}
        carrera={yo.rol === 'estudiante' ? yo.carrera : null}
        responderPropuesta={responderPropuesta}
      />
    )
  } else if (pagina === 'mentores' && esMentor) {
    contenido = (
      <PortalMentores
        yo={yo}
        asesorias={asesorias}
        abrirDetalle={setDetalleId}
        agregarAsesoria={agregarAsesoria}
        eliminarAsesoria={eliminarAsesoria}
        solicitudes={solicitudes}
        aceptarSolicitud={aceptarSolicitud}
        proponerHorario={proponerHorario}
        liberarSolicitud={liberarSolicitud}
        atenderSolicitud={atenderSolicitud}
        editarAsesoria={editarAsesoria}
        guardarResumen={guardarResumen}
        catalogo={catalogo}
      />
    )
  } else if (pagina === 'usuarios' && esAdmin) {
    contenido = (
      <Usuarios yo={yo} usuarios={usuarios} cambiarRol={cambiarRol} cambiarCarrera={cambiarCarrera} />
    )
  } else if (pagina === 'reportes' && (esAdmin || esCoordinador)) {
    contenido = <Reportes yo={yo} api={api} />
  } else if (pagina === 'materias' && (esAdmin || esCoordinador)) {
    contenido = (
      <Materias
        yo={yo}
        api={api}
        catalogo={catalogo}
        agregarMateria={agregarMateria}
        quitarMateria={quitarMateria}
        renombrarMateria={renombrarMateria}
      />
    )
  } else if (pagina === 'especialidades' && (esAdmin || esCoordinador)) {
    contenido = (
      <EspecialidadMentores
        yo={yo}
        mentores={mentores || []}
        catalogo={catalogo}
        asignar={asignarMateriaMentor}
        quitar={quitarMateriaMentor}
      />
    )
  } else if (pagina === 'ayuda') {
    contenido = <CentroAyuda verIntroduccion={() => setVerIntroduccion(true)} />
  } else {
    contenido = (
      <PanelPrincipal asesorias={asesorias} valorar={valorar} setPagina={irA} abrirDetalle={setDetalleId} />
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {ocupado && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 0.85 }}
            exit={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ transformOrigin: 'left' }}
            className="fixed top-0 inset-x-0 h-0.5 bg-acento z-30"
          />
        )}
      </AnimatePresence>

      <div className={'flex h-screen ' + (ocupado ? 'cursor-progress' : '')}>
        <Sidebar
          pagina={pagina}
          setPagina={irA}
          esMentor={esMentor}
          esAdmin={esAdmin}
          esCoordinador={esCoordinador}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            yo={yo}
            notificaciones={notificaciones}
            marcarLeidas={marcarLeidas}
            borrar={borrarNotificacion}
            abrir={abrirNotificacion}
          />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pagina}
                initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
                transition={{ duration: 0.22 }}
              >
                {contenido}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {detalle && (
          <DetalleAsesoria
            key={detalle.id}
            asesoria={detalle}
            catalogo={catalogo}
            solicitud={solicitudes.find((solicitud) => solicitud.asesoriaId === detalle.id)}
            cerrar={cerrarDetalle}
            inscribir={inscribir}
            cancelarInscripcion={cancelar}
            valorar={valorar}
            editarAsesoria={editarAsesoria}
            eliminarAsesoria={eliminarAsesoria}
            guardarResumen={guardarResumen}
            marcarAsistencia={marcarAsistencia}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {faltaCarrera && <ElegirCarrera key="carrera" nombre={yo.nombre} carreras={catalogo} elegir={elegirCarrera} />}
        {mostrarIntroduccion && (
          <Introduccion key="introduccion" rol={yo.rol} nombre={yo.nombre} cerrar={() => terminarIntroduccion(yo.rol)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aviso && (
          <motion.div
            key={aviso.texto}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className={
              'fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 bg-tarjeta border rounded-xl px-4 py-3 text-sm shadow-lg ' +
              (aviso.error ? 'border-primario text-acento' : 'border-borde')
            }
          >
            {aviso.error ? <CircleAlert size={16} /> : <CircleCheck size={16} className="text-emerald-400" />}
            {aviso.texto}
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

export default App
