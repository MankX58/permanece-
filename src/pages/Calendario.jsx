import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, Video, MapPin } from 'lucide-react'
import { fechaDeHoy, fechaLarga } from '../fechas.js'
import { item } from '../animaciones.js'

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

function dosDigitos(numero) {
  return String(numero).padStart(2, '0')
}

function Calendario({ asesorias, abrirDetalle }) {
  const hoy = fechaDeHoy()
  const [mes, setMes] = useState(() => new Date(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1, 1))
  const [seleccionado, setSeleccionado] = useState(hoy)

  // Lo que el usuario da (mentor) o recibe (inscrito), agrupado por día.
  const porDia = {}
  asesorias
    .filter((asesoria) => asesoria.esMia || asesoria.inscrita)
    .forEach((asesoria) => {
      if (!porDia[asesoria.fecha]) porDia[asesoria.fecha] = []
      porDia[asesoria.fecha].push(asesoria)
    })
  Object.values(porDia).forEach((lista) => lista.sort((a, b) => a.horario.localeCompare(b.horario)))

  const anio = mes.getFullYear()
  const numeroMes = mes.getMonth()
  const vacios = (mes.getDay() + 6) % 7 // la semana empieza el lunes
  const diasDelMes = new Date(anio, numeroMes + 1, 0).getDate()
  const celdas = [...Array(vacios).fill(null), ...Array.from({ length: diasDelMes }, (_, i) => i + 1)]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const prefijo = anio + '-' + dosDigitos(numeroMes + 1) + '-'
  const delMes = Object.keys(porDia).filter((fecha) => fecha.startsWith(prefijo))
  const sesionesDelMes = delMes.reduce((suma, fecha) => suma + porDia[fecha].length, 0)
  const sesionesDelDia = porDia[seleccionado] || []

  const nombreMes = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  function moverMes(pasos) {
    setMes(new Date(anio, numeroMes + pasos, 1))
  }

  function irAHoy() {
    setMes(new Date(Number(hoy.slice(0, 4)), Number(hoy.slice(5, 7)) - 1, 1))
    setSeleccionado(hoy)
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-red-400">Calendario</h1>

      <div className="flex items-center justify-between gap-4 mt-6">
        <h2 className="text-lg font-semibold first-letter:uppercase">
          {nombreMes}
          <span className="text-sm font-normal text-zinc-400 ml-3">
            {sesionesDelMes} {sesionesDelMes === 1 ? 'sesión' : 'sesiones'}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={irAHoy}
            className="text-xs font-medium text-zinc-300 hover:text-white border border-borde rounded-lg px-3 py-1.5 mr-2 transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => moverMes(-1)}
            title="Mes anterior"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => moverMes(1)}
            title="Mes siguiente"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mt-4 border-t border-l border-borde rounded-tl-xl">
        {diasSemana.map((dia) => (
          <p key={dia} className="py-2 text-center text-xs font-semibold text-zinc-400 border-r border-b border-borde">
            {dia}
          </p>
        ))}

        {celdas.map((dia, posicion) => {
          if (!dia) {
            return <div key={'v' + posicion} className="min-h-16 sm:min-h-24 border-r border-b border-borde bg-fondo/40" />
          }

          const fecha = prefijo + dosDigitos(dia)
          const sesiones = porDia[fecha] || []
          const esHoy = fecha === hoy
          const activo = fecha === seleccionado

          return (
            <button
              key={fecha}
              onClick={() => setSeleccionado(fecha)}
              className={
                'min-h-16 sm:min-h-24 p-1.5 text-left align-top border-r border-b border-borde transition-colors flex flex-col gap-1 ' +
                (activo ? 'bg-zinc-800/70' : 'hover:bg-zinc-900')
              }
            >
              <span
                className={
                  'text-xs font-medium size-6 flex items-center justify-center rounded-full ' +
                  (esHoy ? 'bg-primario text-white' : activo ? 'text-white' : 'text-zinc-400')
                }
              >
                {dia}
              </span>
              <span className="hidden sm:flex flex-col gap-0.5 min-w-0">
                {sesiones.slice(0, 2).map((asesoria) => (
                  <span
                    key={asesoria.id}
                    className={
                      'truncate rounded px-1.5 py-0.5 text-[10px] leading-tight ' +
                      (asesoria.pasada ? 'bg-zinc-800 text-zinc-400' : 'bg-primario/20 text-acento')
                    }
                  >
                    {asesoria.horario.slice(0, 5)} {asesoria.materia}
                  </span>
                ))}
                {sesiones.length > 2 && <span className="text-[10px] text-zinc-400 px-1.5">+{sesiones.length - 2} más</span>}
              </span>
              {sesiones.length > 0 && (
                <span className="sm:hidden flex gap-1 mt-auto">
                  {sesiones.slice(0, 3).map((asesoria) => (
                    <span
                      key={asesoria.id}
                      className={'size-1.5 rounded-full ' + (asesoria.pasada ? 'bg-zinc-600' : 'bg-acento')}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <h3 className="text-sm font-semibold mt-8 mb-3">{fechaLarga(seleccionado)}</h3>

      {sesionesDelDia.length === 0 && <p className="text-sm text-zinc-400">No tienes asesorías este día.</p>}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sesionesDelDia.map((asesoria) => (
            <motion.button
              key={asesoria.id}
              layout
              variants={item}
              initial="oculto"
              animate="visible"
              exit="salida"
              onClick={() => abrirDetalle(asesoria.id)}
              className={
                'w-full p-4 flex items-center justify-between gap-4 text-left bg-tarjeta rounded-xl hover:bg-zinc-800/60 transition-colors ' +
                (asesoria.pasada ? 'opacity-60' : '')
              }
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{asesoria.materia}</span>
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                  <span>{asesoria.horario}</span>
                  <span className="flex items-center gap-1.5">
                    {asesoria.virtual ? <Video size={13} /> : <MapPin size={13} />}
                    {asesoria.virtual ? 'Virtual' : asesoria.lugar}
                  </span>
                  <span>{asesoria.esMia ? 'Das la asesoría' : 'Con ' + asesoria.tutor}</span>
                  {asesoria.privada && <span>Individual</span>}
                </span>
              </span>
              <span className="text-xs text-zinc-400 shrink-0">
                {asesoria.pasada ? 'Realizada' : 'Ver detalle'}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Calendario
