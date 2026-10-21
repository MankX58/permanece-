import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Download, Search, Loader } from 'lucide-react'
import { carreras } from '../data.js'
import { fechaDeHoy } from '../fechas.js'
import ImpactoPanel from '../components/ImpactoPanel.jsx'
import Plegable from '../components/Plegable.jsx'
import { ListaDatos } from '../components/Resumen.jsx'
import { lista, item, toque } from '../animaciones.js'

function fechaMenos(dias) {
  const [a, m, d] = fechaDeHoy().split('-').map(Number)
  const f = new Date(a, m - 1, d - dias)
  return f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0')
}

const periodos = [
  { id: 'todo', texto: 'Todo el histórico', rango: () => ['', ''] },
  { id: 'anio', texto: 'Este año', rango: () => [fechaDeHoy().slice(0, 4) + '-01-01', ''] },
  { id: 'mes', texto: 'Este mes', rango: () => [fechaDeHoy().slice(0, 7) + '-01', ''] },
  { id: '90', texto: 'Últimos 90 días', rango: () => [fechaMenos(90), ''] },
  { id: '30', texto: 'Últimos 30 días', rango: () => [fechaMenos(30), ''] },
]

function porcentaje(valor) {
  return valor === null || valor === undefined ? '—' : Math.round(valor * 100) + '%'
}

function decimal(valor) {
  return valor === null || valor === undefined ? '—' : valor.toFixed(1)
}

function Reportes({ yo, api }) {
  const esCoordinador = yo.rol === 'coordinador'
  const [periodo, setPeriodo] = useState('todo')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [programa, setPrograma] = useState('')
  const [reporte, setReporte] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [soloActividad, setSoloActividad] = useState(false)

  function parametros() {
    const p = new URLSearchParams()
    if (desde) p.set('desde', desde)
    if (hasta) p.set('hasta', hasta)
    if (programa && !esCoordinador) p.set('programa', programa)
    return p.toString()
  }

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setError(null)

    api('/reportes?' + parametros())
      .then((datos) => vigente && setReporte(datos))
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false))

    return () => {
      vigente = false
    }
  }, [desde, hasta, programa])

  function elegirPeriodo(id) {
    const [d, h] = periodos.find((opcion) => opcion.id === id).rango()
    setPeriodo(id)
    setDesde(d)
    setHasta(h)
  }

  async function descargar() {
    setDescargando(true)
    try {
      await api.descargar('/reportes/excel?' + parametros())
    } catch (e) {
      setError(e.message)
    }
    setDescargando(false)
  }

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'
  const programaActual = esCoordinador ? yo.programa : programa

  const filas = (reporte?.filas || []).filter((fila) => {
    if (soloActividad && fila.realizadas + fila.programadas + fila.solicitudes === 0) return false
    return fila.materia.toLowerCase().includes(busqueda.toLowerCase())
  })
  const maximo = Math.max(1, ...(reporte?.filas || []).map((fila) => fila.realizadas))
  const t = reporte?.totales

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-red-400">Reportes</h1>
        </div>
        <motion.button
          {...toque}
          onClick={descargar}
          disabled={descargando || !reporte}
          className="shrink-0 self-start lg:self-auto flex items-center gap-2 bg-primario hover:bg-red-700 disabled:opacity-50 text-sm font-semibold px-4 py-2.5 rounded-lg"
        >
          {descargando ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
          Descargar Excel
        </motion.button>
      </div>

      <ImpactoPanel api={api} programa={esCoordinador ? '' : programa} />

      <h2 className="text-lg font-semibold mt-10">Uso de la plataforma</h2>
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          {periodos.map((opcion) => (
            <button
              key={opcion.id}
              onClick={() => elegirPeriodo(opcion.id)}
              className={
                'text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ' +
                (periodo === opcion.id
                  ? 'bg-primario/20 border-primario/20 text-red-200'
                  : 'bg-tarjeta border-transparent text-zinc-400 hover:text-white')
              }
            >
              {opcion.texto}
            </button>
          ))}
          <button
            onClick={() => setPeriodo('personalizado')}
            className={
              'text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ' +
              (periodo === 'personalizado'
                ? 'bg-primario/20 border-primario/20 text-red-200'
                : 'bg-tarjeta border-transparent text-zinc-400 hover:text-white')
            }
          >
            Personalizado
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-3">
          {periodo === 'personalizado' && (
            <>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => {
                setPeriodo('personalizado')
                setDesde(e.target.value)
              }}
              className={claseCampo}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => {
                setPeriodo('personalizado')
                setHasta(e.target.value)
              }}
              className={claseCampo}
            />
          </label>
            </>
          )}

          {!esCoordinador && (
            <select value={programa} onChange={(e) => setPrograma(e.target.value)} className={claseCampo}>
              <option value="">Todos los programas</option>
              {carreras.map((carrera) => (
                <option key={carrera.nombre}>{carrera.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-acento bg-primario/10 border border-primario/30 rounded-xl p-4 mt-4">{error}</p>
      )}

      {cargando && !reporte && <p className="text-sm text-zinc-400 mt-6">Calculando el informe...</p>}

      {t && (
        <>
          <div className="mt-4">
            <ListaDatos
              datos={[
                {
                  etiqueta: 'Asesorías realizadas',
                  valor: t.realizadas,
                  detalle: t.programadas + ' programadas · ' + t.individuales + ' individuales, ' + t.grupales + ' grupales',
                },
                { etiqueta: 'Inscripciones', valor: t.inscritos, detalle: t.estudiantesUnicos + ' estudiantes distintos' },
                {
                  etiqueta: 'Asistencia',
                  valor: porcentaje(t.tasaAsistencia),
                  detalle: t.asistieron + ' asistieron · ' + t.noAsistieron + ' no · ' + t.sinRegistrar + ' sin registrar',
                },
                { etiqueta: 'Horas impartidas', valor: t.horas.toFixed(1), detalle: 'Suma de sesiones realizadas' },
                {
                  etiqueta: 'Valoración promedio',
                  valor: decimal(t.valoracion) + (t.valoracion === null ? '' : ' / 5'),
                  detalle: t.resenas + ' reseñas',
                },
                { etiqueta: 'Solicitudes recibidas', valor: t.solicitudes, detalle: t.aceptadas + ' aceptadas por un mentor' },
              ]}
            />
          </div>

          {reporte.programas && !esCoordinador && (
            <Plegable titulo="Por programa" className="mt-10">
              <div className="bg-tarjeta rounded-2xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-zinc-400 border-b border-borde">
                    <tr>
                      <th className="p-3 font-semibold">Programa</th>
                      <th className="p-3 font-semibold text-center">Materias con actividad</th>
                      <th className="p-3 font-semibold text-center">Asesorías</th>
                      <th className="p-3 font-semibold text-center">Inscripciones</th>
                      <th className="p-3 font-semibold text-center">Asistencia</th>
                      <th className="p-3 font-semibold text-center">Solicitudes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.programas.map((fila) => (
                      <tr
                        key={fila.programa}
                        onClick={() => setPrograma(fila.programa)}
                        className="border-b border-borde last:border-0 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                      >
                        <td className="p-3 font-medium">{fila.programa}</td>
                        <td className="p-3 text-center text-zinc-400">
                          {fila.materiasConActividad}/{fila.totalMaterias}
                        </td>
                        <td className="p-3 text-center">{fila.realizadas}</td>
                        <td className="p-3 text-center">{fila.inscritos}</td>
                        <td className="p-3 text-center">{porcentaje(fila.tasaAsistencia)}</td>
                        <td className="p-3 text-center">{fila.solicitudes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Plegable>
          )}

          <Plegable
            titulo="Por materia"
            subtitulo={programaActual}
            className="mt-10"
            acciones={
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={soloActividad} onChange={(e) => setSoloActividad(e.target.checked)} />
                  Solo con actividad
                </label>
                <div className="flex items-center gap-2 border border-borde rounded-lg px-3 focus-within:border-acento transition-colors">
                  <Search size={14} className="text-zinc-400" />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar materia..."
                    className="bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-400 w-44"
                  />
                </div>
              </div>
            }
          >
            <div className="bg-tarjeta rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-zinc-400 border-b border-borde">
                  <tr>
                    <th className="p-3 font-semibold">Materia</th>
                    <th className="p-3 font-semibold w-48">Asesorías realizadas</th>
                    <th className="p-3 font-semibold text-center">Inscripciones</th>
                    <th className="p-3 font-semibold text-center">Asistieron</th>
                    <th className="p-3 font-semibold text-center">% asistencia</th>
                    <th className="p-3 font-semibold text-center">Valoración</th>
                    <th className="p-3 font-semibold text-center">Solicitudes</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila) => {
                    const sinActividad = fila.realizadas + fila.programadas + fila.solicitudes === 0

                    return (
                      <tr key={fila.materia} className={'border-b border-borde last:border-0 ' + (sinActividad ? 'opacity-50' : '')}>
                        <td className="p-3">
                          <p className="font-medium">{fila.materia}</p>
                          {!programaActual && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {fila.programas.length > 0 ? fila.programas.join(' · ') : 'Sin catalogar'}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-right font-semibold">{fila.realizadas}</span>
                            <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-acento rounded-full"
                                style={{ width: (fila.realizadas / maximo) * 100 + '%' }}
                              />
                            </div>
                          </div>
                          {fila.programadas > 0 && (
                            <p className="text-[11px] text-zinc-400 mt-1">+{fila.programadas} programadas</p>
                          )}
                        </td>
                        <td className="p-3 text-center">{fila.inscritos}</td>
                        <td className="p-3 text-center">
                          {fila.asistieron}
                          {fila.sinRegistrar > 0 && (
                            <span className="block text-[11px] text-zinc-400">{fila.sinRegistrar} sin registrar</span>
                          )}
                        </td>
                        <td className="p-3 text-center">{porcentaje(fila.tasaAsistencia)}</td>
                        <td className="p-3 text-center">{decimal(fila.valoracion)}</td>
                        <td className="p-3 text-center">{fila.solicitudes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filas.length === 0 && (
                <p className="text-sm text-zinc-400 p-5">No hay materias que coincidan con el filtro.</p>
              )}
            </div>
          </Plegable>
        </>
      )}
    </div>
  )
}

export default Reportes
