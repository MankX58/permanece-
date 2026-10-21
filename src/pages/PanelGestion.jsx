import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Pendientes from '../components/Pendientes.jsx'
import { EnLinea } from '../components/Resumen.jsx'
import { toque } from '../animaciones.js'

const porcentaje = (valor) => (valor === null || valor === undefined ? '—' : Math.round(valor * 100) + '%')

// Panel principal del coordinador y del administrador: cuántas personas y materias gestionan, cómo va el uso
// de la plataforma y lo que falta por asignar o completar.
function PanelGestion({ yo, usuarios, mentores, catalogo, api, setPagina }) {
  const esAdmin = yo.rol === 'admin'
  const [totales, setTotales] = useState(null)

  useEffect(() => {
    let vigente = true
    api('/reportes')
      .then((reporte) => vigente && setTotales(reporte.totales))
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios)
  const sinMaterias = mentores.filter((persona) => persona.materias.length === 0).length

  let personas
  let items
  if (esAdmin) {
    const cuantos = (rol) => usuarios.filter((usuario) => usuario.rol === rol).length
    const sinCarrera = usuarios.filter((u) => ['estudiante', 'mentor'].includes(u.rol) && !u.carrera).length
    const sinPrograma = usuarios.filter((u) => u.rol === 'coordinador' && !u.programa).length
    personas = [
      { valor: cuantos('estudiante'), etiqueta: 'estudiantes' },
      { valor: cuantos('mentor'), etiqueta: 'mentores' },
      { valor: cuantos('docente'), etiqueta: 'docentes' },
      { valor: cuantos('coordinador'), etiqueta: 'coordinadores' },
    ]
    items = [
      sinPrograma > 0 && {
        texto: plural(sinPrograma, 'coordinador sin programa asignado', 'coordinadores sin programa asignado'),
        boton: 'Asignar',
        destino: 'usuarios',
      },
      sinCarrera > 0 && {
        texto: plural(sinCarrera, 'usuario que aún no elige su carrera', 'usuarios que aún no eligen su carrera'),
        boton: 'Ver usuarios',
        destino: 'usuarios',
      },
      sinMaterias > 0 && {
        texto: plural(sinMaterias, 'mentor o docente sin materias asignadas', 'mentores o docentes sin materias asignadas'),
        boton: 'Asignar',
        destino: 'especialidades',
      },
    ].filter(Boolean)
  } else {
    const materias = catalogo.find((carrera) => carrera.nombre === yo.programa)?.materias.length ?? 0
    personas = [
      { valor: mentores.length, etiqueta: 'mentores y docentes' },
      { valor: materias, etiqueta: 'materias en el programa' },
    ]
    items = [
      !yo.programa && { texto: 'Aún no tienes un programa asignado. Pídele al administrador que lo asigne.' },
      sinMaterias > 0 && {
        texto: plural(sinMaterias, 'mentor o docente de tu programa sin materias asignadas', 'mentores o docentes de tu programa sin materias asignadas'),
        boton: 'Asignar',
        destino: 'especialidades',
      },
    ].filter(Boolean)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-red-400">{esAdmin ? 'Resumen de la plataforma' : 'Resumen del programa'}</h1>
          <p className="text-sm text-zinc-400 mt-1">{esAdmin ? 'Todos los programas' : yo.programa || 'Sin programa asignado'}</p>
        </div>
        <motion.button
          {...toque}
          onClick={() => setPagina('reportes')}
          className="shrink-0 self-start sm:self-auto bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg"
        >
          Ver reportes
        </motion.button>
      </div>

      <EnLinea className="mt-4" datos={personas} />
      {totales && (
        <EnLinea
          className="mt-1"
          datos={[
            { valor: totales.realizadas, etiqueta: 'asesorías realizadas' },
            { valor: porcentaje(totales.tasaAsistencia), etiqueta: 'de asistencia' },
            {
              valor: totales.valoracion === null ? '—' : totales.valoracion.toFixed(1) + ' /5',
              etiqueta: 'valoración promedio',
            },
            { valor: totales.solicitudes, etiqueta: 'solicitudes recibidas' },
          ]}
        />
      )}

      <Pendientes items={items} irA={setPagina} className="mt-8" />
    </div>
  )
}

export default PanelGestion
