import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import { item } from '../animaciones.js'

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function Materias({ yo, catalogo }) {
  const esCoordinador = yo.rol === 'coordinador'
  const [elegida, setElegida] = useState(catalogo[0]?.nombre || '')
  const [busqueda, setBusqueda] = useState('')

  // El coordinador solo ve su programa; el admin elige cualquiera.
  const nombreCarrera = esCoordinador ? yo.programa : elegida
  const carrera = catalogo.find((c) => c.nombre === nombreCarrera)

  if (!carrera) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">Materias</h1>
        <p className="text-sm text-acento bg-primario/10 border border-primario/30 rounded-xl p-4 mt-6">
          Aún no tienes un programa asignado. Pídele al administrador que lo asigne.
        </p>
      </div>
    )
  }

  // materia -> otras carreras donde también se ve.
  const otrasCarreras = (materia) =>
    catalogo.filter((c) => c.nombre !== carrera.nombre && c.materias.includes(materia)).map((c) => c.nombre)

  const buscado = normalizar(busqueda)
  const visibles = [...carrera.materias]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .filter((materia) => normalizar(materia).includes(buscado))

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Materias</h1>
      <p className="text-sm text-zinc-400 mt-1">
        {esCoordinador
          ? 'Las materias de tu programa: ' + carrera.nombre + '.'
          : 'Las materias de cada carrera: el plan oficial más las que agregaron los coordinadores.'}
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        {!esCoordinador && (
          <select value={elegida} onChange={(e) => setElegida(e.target.value)} className={claseCampo}>
            {catalogo.map((c) => (
              <option key={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        )}
        <div className="flex-1 min-w-52 flex items-center gap-2.5 border border-borde rounded-lg px-3 focus-within:border-acento transition-colors">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar materia..."
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
      </div>

      <p className="text-xs text-zinc-500 mt-4">
        {carrera.materias.length} materias
        {carrera.agregadas.length > 0 && ' · ' + carrera.agregadas.length + ' agregadas por coordinación'}
      </p>

      {visibles.length === 0 && <p className="text-sm text-zinc-500 mt-4">No hay materias con ese nombre.</p>}

      <div className="divide-y divide-borde mt-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibles.map((materia) => {
            const otras = otrasCarreras(materia)
            return (
              <motion.div
                key={carrera.nombre + materia}
                layout
                variants={item}
                initial="oculto"
                animate="visible"
                exit="salida"
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{materia}</p>
                  {otras.length > 0 && (
                    <p className="text-xs text-zinc-500 truncate">También en {otras.join(' · ')}</p>
                  )}
                </div>
                {carrera.agregadas.includes(materia) && (
                  <span className="shrink-0 text-[11px] font-semibold text-acento border border-primario/40 bg-primario/10 rounded-full px-2.5 py-0.5">
                    Agregada
                  </span>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Materias
