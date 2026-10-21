import { useState } from 'react'
import { motion } from 'motion/react'
import { Video, Download } from 'lucide-react'
import { DonutChart } from '../components/arc/donut-chart/donut-chart'
import FilaHistorial from '../components/FilaHistorial.jsx'
import CajaClicable from '../components/CajaClicable.jsx'
import MiPromedio from '../components/MiPromedio.jsx'
import { EnLinea } from '../components/Resumen.jsx'
import { fechaCorta, esEsteMes, promedio } from '../fechas.js'
import { lista, item, toque } from '../animaciones.js'

function PanelPrincipal({ asesorias, valorar, setPagina, abrirDetalle, promedios, guardarPromedio, quitarPromedio }) {
  const [materia, setMateria] = useState('Todas')

  const inscritas = asesorias.filter((asesoria) => asesoria.inscrita)
  const misSesiones = inscritas.filter((asesoria) => !asesoria.pasada)
  const historial = inscritas.filter((asesoria) => asesoria.pasada).reverse()
  const proxima = misSesiones[0]

  const esteMes = historial.filter((asesoria) => esEsteMes(asesoria.fecha))
  const valoradas = historial.filter((asesoria) => asesoria.miValoracion)
  const calificacion = promedio(valoradas.map((asesoria) => asesoria.miValoracion))

  const porMateria = []
  inscritas.forEach((asesoria) => {
    const parte = porMateria.find((p) => p.key === asesoria.materia)
    if (parte) {
      parte.value += 1
    } else {
      porMateria.push({ key: asesoria.materia, label: asesoria.materia, value: 1 })
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

  const claseTarjeta = 'bg-tarjeta rounded-2xl p-5'
  const claseEtiqueta = 'text-xs text-zinc-400'

  return (
    <div>
      <h1 className="text-2xl font-semibold">Resumen académico</h1>

      <EnLinea
        className="mt-2"
        datos={[
          { valor: historial.length, etiqueta: 'asesorías (+' + esteMes.length + ' este mes)' },
          {
            valor: calificacion ? Number(calificacion).toFixed(1) + ' /5' : '—',
            etiqueta: 'calificación promedio, de ' + valoradas.length + ' valoraciones tuyas',
          },
        ]}
      />

      <CajaClicable
        onClick={proxima ? () => abrirDetalle(proxima.id) : undefined}
        className="bg-tarjeta rounded-2xl p-5 mt-6 flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className={claseEtiqueta}>Próxima sesión</p>
          {proxima ? (
            <>
              <p className="text-lg font-semibold mt-1">
                <button onClick={() => abrirDetalle(proxima.id)} className="text-left hover:underline">
                  {proxima.materia}
                </button>
              </p>
              <p className="text-sm text-zinc-400">
                {fechaCorta(proxima.fecha)}, {proxima.horario} · {proxima.lugar}
                {proxima.virtual && !proxima.enlace && ' · Aún sin enlace'}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-400 mt-1">Todavía no estás inscrito en ninguna asesoría.</p>
          )}
        </div>

        {proxima && proxima.virtual && proxima.enlace && (
          <motion.a
            {...toque}
            href={proxima.enlace}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center justify-center gap-2 bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg"
          >
            <Video size={16} />
            Entrar a la sala virtual
          </motion.a>
        )}
        {!proxima && (
          <motion.button
            {...toque}
            onClick={() => setPagina('banco')}
            className="shrink-0 bg-primario hover:bg-red-700 text-sm font-semibold px-5 py-2 rounded-lg"
          >
            Buscar asesorías
          </motion.button>
        )}
      </CajaClicable>

      {promedios && <MiPromedio promedios={promedios} guardar={guardarPromedio} quitar={quitarPromedio} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold">Historial de asesorías</h2>
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
            <p className="text-sm text-zinc-400">
              Aquí aparecerán las asesorías a las que te inscribiste cuando pase su fecha.
            </p>
          ) : (
            <div className="bg-tarjeta rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="text-xs text-zinc-400 border-b border-borde">
                  <tr>
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Materia y tutor</th>
                    <th className="p-4 font-semibold">Resumen</th>
                    <th className="p-4 font-semibold">Tu valoración</th>
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

          <h2 className="text-base font-semibold mt-8 mb-4">Tus asesorías por materia</h2>
          <div className={claseTarjeta}>
            <DonutChart
              label="Asesorías por materia"
              unit="asesorías"
              data={porMateria}
              size={170}
              thickness={18}
              otherLabel="Otras"
              emptyLabel="Aún sin inscripciones"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Próximas sesiones</h2>
            <button
              onClick={() => setPagina('solicitudes')}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Ver todas
            </button>
          </div>

          {misSesiones.length === 0 && <p className="text-sm text-zinc-400">No tienes sesiones programadas.</p>}

          <motion.div variants={lista} initial="oculto" animate="visible" className="space-y-3">
            {misSesiones.map((sesion) => (
              <motion.button
                key={sesion.id}
                variants={item}
               
                onClick={() => abrirDetalle(sesion.id)}
                className="w-full text-left bg-tarjeta rounded-xl p-4 block"
              >
                <p className="text-xs text-zinc-400">
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
