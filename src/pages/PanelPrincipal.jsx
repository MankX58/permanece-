import { useState } from 'react'
import { motion } from 'motion/react'
import { GraduationCap, Star, CalendarDays, TrendingUp, Video, Download } from 'lucide-react'
import { AnimatedCounter } from '../components/arc/animated-counter/animated-counter'
import { DonutChart } from '../components/arc/donut-chart/donut-chart'
import FilaHistorial from '../components/FilaHistorial.jsx'
import CajaClicable from '../components/CajaClicable.jsx'
import { fechaCorta, esEsteMes, promedio } from '../fechas.js'
import { lista, item, toque } from '../animaciones.js'

function PanelPrincipal({ asesorias, valorar, setPagina, abrirDetalle }) {
  const [materia, setMateria] = useState('Todas')

  const inscritas = asesorias.filter((asesoria) => asesoria.inscrita)
  const misSesiones = inscritas.filter((asesoria) => !asesoria.pasada)
  const historial = inscritas.filter((asesoria) => asesoria.pasada).reverse()
  const proxima = misSesiones[0]

  const esteMes = historial.filter((asesoria) => esEsteMes(asesoria.fecha))
  const valoradas = historial.filter((asesoria) => asesoria.miValoracion)
  const calificacion = promedio(valoradas.map((asesoria) => asesoria.miValoracion))

  const porArea = []
  inscritas.forEach((asesoria) => {
    const area = porArea.find((parte) => parte.key === asesoria.area)
    if (area) {
      area.value += 1
    } else {
      porArea.push({ key: asesoria.area, label: asesoria.area, value: 1 })
    }
  })

  const materias = ['Todas']
  historial.forEach((asesoria) => {
    if (!materias.includes(asesoria.materia)) {
      materias.push(asesoria.materia)
    }
  })

  const historialFiltrado = historial.filter(
    (asesoria) => materia === 'Todas' || asesoria.materia === materia
  )

  function descargarHistorial() {
    let texto = 'Fecha;Materia;Tutor;Resumen;Valoración\n'
    historialFiltrado.forEach((asesoria) => {
      texto +=
        [asesoria.fecha, asesoria.materia, asesoria.tutor, asesoria.descripcion, asesoria.miValoracion || ''].join(
          ';'
        ) + '\n'
    })

    const archivo = new Blob(['﻿' + texto], { type: 'text/csv' })
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(archivo)
    enlace.download = 'historial-asesorias.csv'
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  const claseTarjeta = 'bg-tarjeta border border-borde rounded-2xl p-5'
  const claseEtiqueta = 'text-xs font-semibold tracking-wider text-zinc-400'

  return (
    <div>
      <h1 className="text-2xl font-bold">Resumen Académico</h1>
      <p className="text-sm text-zinc-400 mt-1">Tu progreso académico y próximas sesiones programadas.</p>

      <motion.div
        variants={lista}
        initial="oculto"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6"
      >
        <motion.div variants={item} whileHover={{ y: -4 }} className={claseTarjeta}>
          <div className="flex items-center gap-3">
            <div className="bg-primario rounded-full p-2">
              <GraduationCap size={16} />
            </div>
            <p className={claseEtiqueta}>ASESORÍAS TOTALES</p>
          </div>
          <div className="mt-4">
            <AnimatedCounter value={historial.length} animateOnView />
          </div>
          <p className="flex items-center gap-1.5 text-sm text-acento font-medium mt-2">
            <TrendingUp size={16} />+{esteMes.length} este mes
          </p>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -4 }} className={claseTarjeta}>
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 rounded-full p-2 text-acento">
              <Star size={16} />
            </div>
            <p className={claseEtiqueta}>CALIFICACIÓN PROMEDIO</p>
          </div>
          <div className="mt-4">
            {calificacion ? (
              <AnimatedCounter value={Number(calificacion)} decimals={1} suffix=" /5" animateOnView />
            ) : (
              <p className="text-3xl font-medium text-zinc-600">—</p>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-2">Basado en {valoradas.length} valoraciones tuyas</p>
        </motion.div>

        <CajaClicable
          variants={item}
          whileHover={{ y: -4 }}
          onClick={proxima ? () => abrirDetalle(proxima.id) : undefined}
          className={claseTarjeta + ' border-primario/40'}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={proxima ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-zinc-800 rounded-full p-2 text-acento"
            >
              <CalendarDays size={16} />
            </motion.div>
            <p className="text-xs font-semibold tracking-wider">PRÓXIMA SESIÓN</p>
          </div>

          {proxima ? (
            <div>
              <p className="text-lg font-bold mt-3">
                <button onClick={() => abrirDetalle(proxima.id)} className="text-left hover:underline">
                  {proxima.materia}
                </button>
              </p>
              <p className="text-sm text-zinc-400">
                {fechaCorta(proxima.fecha)}, {proxima.horario} - {proxima.lugar}
              </p>
              {proxima.virtual && proxima.enlace ? (
                <motion.a
                  {...toque}
                  href={proxima.enlace}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-primario hover:bg-red-700 text-sm font-semibold py-2.5 rounded-lg mt-4"
                >
                  <Video size={16} />
                  Entrar a Sala Virtual
                </motion.a>
              ) : (
                <p className="text-center text-xs text-zinc-400 border border-borde rounded-lg py-2.5 mt-4">
                  {proxima.virtual ? 'Sesión virtual sin enlace todavía' : 'Sesión presencial'}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-zinc-400 mt-3">Todavía no estás inscrito en ninguna asesoría.</p>
              <motion.button
                {...toque}
                onClick={() => setPagina('banco')}
                className="w-full bg-primario hover:bg-red-700 text-sm font-semibold py-2.5 rounded-lg mt-4"
              >
                Buscar asesorías
              </motion.button>
            </div>
          )}
        </CajaClicable>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Historial de Asesorías</h2>
            <div className="flex gap-2">
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="bg-tarjeta border border-borde rounded-lg px-2.5 py-1.5 text-xs"
              >
                {materias.map((opcion) => (
                  <option key={opcion}>{opcion}</option>
                ))}
              </select>
              <motion.button
                {...toque}
                onClick={descargarHistorial}
                disabled={historialFiltrado.length === 0}
                title="Descargar historial"
                className="bg-tarjeta border border-borde rounded-lg p-2 hover:bg-zinc-800 disabled:opacity-40"
              >
                <Download size={16} />
              </motion.button>
            </div>
          </div>

          {historial.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aquí aparecerán las asesorías a las que te inscribiste cuando pase su fecha.
            </p>
          ) : (
            <div className="bg-tarjeta border border-borde rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="text-xs text-zinc-400 tracking-wider border-b border-borde">
                  <tr>
                    <th className="p-4 font-semibold">FECHA</th>
                    <th className="p-4 font-semibold">MATERIA / TUTOR</th>
                    <th className="p-4 font-semibold">RESUMEN</th>
                    <th className="p-4 font-semibold">TU VALORACIÓN</th>
                  </tr>
                </thead>
                <motion.tbody variants={lista} initial="oculto" animate="visible">
                  {historialFiltrado.map((asesoria) => (
                    <FilaHistorial
                      key={asesoria.id}
                      asesoria={asesoria}
                      valorar={valorar}
                      abrirDetalle={abrirDetalle}
                    />
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}

          <h2 className="text-lg font-bold mt-8 mb-4">Tus asesorías por área</h2>
          <div className={claseTarjeta}>
            <DonutChart
              label="Asesorías por área"
              unit="asesorías"
              data={porArea}
              size={170}
              thickness={18}
              otherLabel="Otras"
              emptyLabel="Aún sin inscripciones"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Próximas Sesiones</h2>
            <button
              onClick={() => setPagina('solicitudes')}
              className="text-xs font-semibold text-acento hover:underline"
            >
              Ver todas
            </button>
          </div>

          {misSesiones.length === 0 && <p className="text-sm text-zinc-500">No tienes sesiones programadas.</p>}

          <motion.div variants={lista} initial="oculto" animate="visible" className="space-y-3">
            {misSesiones.map((sesion) => (
              <motion.button
                key={sesion.id}
                variants={item}
                whileHover={{ x: 6 }}
                onClick={() => abrirDetalle(sesion.id)}
                className="w-full text-left bg-tarjeta border border-borde border-l-4 border-l-primario rounded-xl p-4 block"
              >
                <p className="text-xs font-semibold text-acento">
                  {fechaCorta(sesion.fecha)}, {sesion.horario}
                </p>
                <p className="text-sm font-semibold mt-1">{sesion.materia}</p>
                <p className="text-xs text-zinc-400 mt-1">{sesion.tutor}</p>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default PanelPrincipal
