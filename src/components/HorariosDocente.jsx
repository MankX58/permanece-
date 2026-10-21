import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, MapPin, Video } from 'lucide-react'
import Plegable from './Plegable.jsx'
import { fechaCorta, fechaDeHoy } from '../fechas.js'
import { desplegar, toque } from '../animaciones.js'

export const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function vigencia(horario) {
  if (horario.hasta) return fechaCorta(horario.desde) + ' al ' + fechaCorta(horario.hasta)
  return 'Desde el ' + fechaCorta(horario.desde)
}

// Una fila con un horario permanente: "Lunes 14:00 - 16:00", a qué materia aplica y dónde.
// Sin `quitar` es solo de lectura; con `mostrarDocente` incluye quién lo da (vista del estudiante).
export function FilaHorario({ horario, mostrarDocente = false, quitar }) {
  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3.5">
      <div className="w-40 shrink-0">
        <p className="text-sm font-semibold">{dias[horario.dia - 1]}</p>
        <p className="text-xs text-zinc-400 tabular-nums">{horario.horario}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{horario.materia || 'General (todas las materias)'}</p>
        <p className="text-xs text-zinc-400">
          {mostrarDocente && horario.docente + ' · '}
          {vigencia(horario)}
        </p>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-300 min-w-0">
        {horario.virtual ? <Video size={13} className="text-acento shrink-0" /> : <MapPin size={13} className="text-acento shrink-0" />}
        {horario.virtual && horario.enlace ? (
          <a href={horario.enlace} target="_blank" rel="noreferrer" className="truncate hover:underline">
            Virtual
          </a>
        ) : (
          <span className="truncate">{horario.lugar}</span>
        )}
      </p>
      {quitar && (
        <button
          onClick={() => quitar(horario.id)}
          title="Eliminar horario"
          className="shrink-0 p-2 rounded-lg text-zinc-400 hover:text-acento hover:bg-zinc-800 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      )}
    </li>
  )
}

const vacio = { dia: '1', inicio: '', fin: '', materia: '', virtual: false, lugar: '', enlace: '', desde: fechaDeHoy(), hasta: '' }
const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'

// El docente arma su semana: cada horario es un día, una franja y la materia a la que aplica (o general).
function HorariosDocente({ horarios, materias, agregar, quitar, className = '' }) {
  const [abierto, setAbierto] = useState(false)
  const [valor, setValor] = useState(vacio)
  const [enviando, setEnviando] = useState(false)
  const cambiar = (campo, dato) => setValor((actual) => ({ ...actual, [campo]: dato }))

  async function enviar(evento) {
    evento.preventDefault()
    setEnviando(true)
    const bien = await agregar({
      dia: Number(valor.dia),
      horario: valor.inicio + ' - ' + valor.fin,
      materia: valor.materia || null,
      virtual: valor.virtual,
      lugar: valor.virtual ? 'Virtual' : valor.lugar,
      enlace: valor.virtual ? valor.enlace || null : null,
      desde: valor.desde,
      hasta: valor.hasta || null,
    })
    if (bien) {
      setValor(vacio)
      setAbierto(false)
    }
    setEnviando(false)
  }

  return (
    <Plegable
      titulo="Mis horarios permanentes"
      cantidad={horarios.length}
      className={className}
      acciones={
        <motion.button
          {...toque}
          onClick={() => setAbierto(!abierto)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-primario hover:bg-red-700 transition-colors"
        >
          <Plus size={14} />
          Nuevo horario
        </motion.button>
      }
    >
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.form {...desplegar} onSubmit={enviar} className="overflow-hidden">
            <div className="bg-tarjeta rounded-2xl p-5 mb-3 grid sm:grid-cols-2 gap-3">
              <label className="text-xs text-zinc-400">
                Día de la semana
                <select value={valor.dia} onChange={(e) => cambiar('dia', e.target.value)} className={claseCampo + ' w-full mt-1.5'}>
                  {dias.map((nombre, i) => (
                    <option key={nombre} value={i + 1}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3">
                <label className="flex-1 text-xs text-zinc-400">
                  Desde las
                  <input required type="time" value={valor.inicio} onChange={(e) => cambiar('inicio', e.target.value)} className={claseCampo + ' w-full mt-1.5'} />
                </label>
                <label className="flex-1 text-xs text-zinc-400">
                  Hasta las
                  <input required type="time" min={valor.inicio} value={valor.fin} onChange={(e) => cambiar('fin', e.target.value)} className={claseCampo + ' w-full mt-1.5'} />
                </label>
              </div>

              <label className="text-xs text-zinc-400 sm:col-span-2">
                Materia
                <select value={valor.materia} onChange={(e) => cambiar('materia', e.target.value)} className={claseCampo + ' w-full mt-1.5'}>
                  <option value="">General: aplica a todas las materias</option>
                  {materias.map((materia) => (
                    <option key={materia}>{materia}</option>
                  ))}
                </select>
              </label>

              <div className="flex bg-fondo rounded-lg p-1 self-end">
                {[false, true].map((virtual) => (
                  <button
                    type="button"
                    key={String(virtual)}
                    onClick={() => cambiar('virtual', virtual)}
                    className={
                      'flex-1 px-3 py-1.5 rounded-md text-xs transition-colors ' +
                      (valor.virtual === virtual ? 'bg-primario/20 text-red-200' : 'text-zinc-400 hover:text-white')
                    }
                  >
                    {virtual ? 'Virtual' : 'Presencial'}
                  </button>
                ))}
              </div>
              {valor.virtual ? (
                <input type="url" value={valor.enlace} onChange={(e) => cambiar('enlace', e.target.value)} placeholder="Enlace de la reunión (opcional)" className={claseCampo + ' self-end'} />
              ) : (
                <input required value={valor.lugar} onChange={(e) => cambiar('lugar', e.target.value)} placeholder="Lugar (oficina, sala, biblioteca...)" className={claseCampo + ' self-end'} />
              )}

              <label className="text-xs text-zinc-400">
                Rige desde
                <input required type="date" min={fechaDeHoy()} value={valor.desde} onChange={(e) => cambiar('desde', e.target.value)} className={claseCampo + ' w-full mt-1.5'} />
              </label>
              <label className="text-xs text-zinc-400">
                Hasta (opcional)
                <input type="date" min={valor.desde} value={valor.hasta} onChange={(e) => cambiar('hasta', e.target.value)} className={claseCampo + ' w-full mt-1.5'} />
              </label>

              <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
                <p className="text-xs text-zinc-400">Se repite cada semana hasta que lo elimines o llegue la fecha final.</p>
                <motion.button
                  {...toque}
                  type="submit"
                  disabled={enviando}
                  className="shrink-0 bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-5 py-2 text-sm font-semibold"
                >
                  Guardar horario
                </motion.button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {horarios.length === 0 ? (
        <p className="text-sm text-zinc-400 bg-tarjeta rounded-2xl p-5">
          Aún no tienes horarios permanentes. Agrega los días y horas en que atiendes cada semana.
        </p>
      ) : (
        <ul className="bg-tarjeta rounded-2xl divide-y divide-borde">
          {horarios.map((horario) => (
            <FilaHorario key={horario.id} horario={horario} quitar={quitar} />
          ))}
        </ul>
      )}
    </Plegable>
  )
}

export default HorariosDocente
