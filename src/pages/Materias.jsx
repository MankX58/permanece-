import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Sparkles, X } from 'lucide-react'
import { item } from '../animaciones.js'

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function Materias({ yo, catalogo, agregarMateria, quitarMateria }) {
  const esCoordinador = yo.rol === 'coordinador'
  const [elegida, setElegida] = useState(catalogo[0]?.nombre || '')
  const [busqueda, setBusqueda] = useState('')
  const [nueva, setNueva] = useState('')

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

  // Para agregar: materias de otras carreras que aún no están en esta, o una nueva si no existe en ninguna.
  const textoNuevo = nueva.replace(/\s+/g, ' ').trim()
  const buscadoNuevo = normalizar(textoNuevo)
  const todas = [...new Set(catalogo.flatMap((c) => c.materias))].sort((a, b) => a.localeCompare(b, 'es'))
  const sugerencias = todas
    .filter((materia) => !carrera.materias.includes(materia) && normalizar(materia).includes(buscadoNuevo))
    .slice(0, 8)
  const yaEsta = carrera.materias.some((materia) => normalizar(materia) === buscadoNuevo)
  const existe = todas.some((materia) => normalizar(materia) === buscadoNuevo)

  async function agregar(materia) {
    if (await agregarMateria(carrera.nombre, materia)) setNueva('')
  }

  // Enter agrega la materia existente que coincide exacto, o crea la nueva.
  function alEnviar(e) {
    e.preventDefault()
    if (textoNuevo.length < 3 || yaEsta) return
    agregar(existe ? todas.find((materia) => normalizar(materia) === buscadoNuevo) : textoNuevo)
  }

  function quitar(materia) {
    if (window.confirm('¿Quitar ' + materia + ' de ' + carrera.nombre + '? Las asesorías que ya tiene no se borran.')) {
      quitarMateria(carrera.nombre, materia)
    }
  }

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Materias</h1>
      <p className="text-sm text-zinc-400 mt-1">
        {esCoordinador
          ? 'Las materias de tu programa: ' + carrera.nombre + '.'
          : 'Las materias de cada carrera: el plan oficial más las que agregaron los coordinadores.'}
      </p>

      {!esCoordinador && (
        <select value={elegida} onChange={(e) => setElegida(e.target.value)} className={claseCampo + ' mt-6'}>
          {catalogo.map((c) => (
            <option key={c.nombre}>{c.nombre}</option>
          ))}
        </select>
      )}

      <div className="bg-tarjeta border border-borde rounded-2xl p-4 mt-6">
        <p className="text-sm font-semibold">Agregar materia a {carrera.nombre}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Busca una materia que ya se vea en otra carrera, o escribe el nombre de una nueva.
        </p>
        <form onSubmit={alEnviar} className="mt-3">
          <input
            type="text"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            maxLength={120}
            placeholder="Nombre de la materia..."
            className={claseCampo + ' w-full'}
          />
        </form>

        {textoNuevo.length >= 2 && (
          <div className="mt-2 divide-y divide-borde">
            {sugerencias.map((materia) => (
              <button
                key={materia}
                type="button"
                onClick={() => agregar(materia)}
                className="w-full flex items-center justify-between gap-3 py-2 text-left group"
              >
                <span className="min-w-0">
                  <span className="block text-sm">{materia}</span>
                  <span className="block truncate text-[11px] text-zinc-500">En {otrasCarreras(materia).join(' · ')}</span>
                </span>
                <Plus size={16} className="shrink-0 text-zinc-500 group-hover:text-acento" />
              </button>
            ))}

            {yaEsta ? (
              <p className="py-2 text-xs text-zinc-500">Esa materia ya está en {carrera.nombre}.</p>
            ) : (
              !existe &&
              textoNuevo.length >= 3 && (
                <button
                  type="button"
                  onClick={() => agregar(textoNuevo)}
                  className="w-full flex items-center gap-2 py-2 text-left text-sm text-acento hover:underline"
                >
                  <Sparkles size={15} className="shrink-0" />
                  Crear «{textoNuevo}» como materia nueva
                </button>
              )
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 border border-borde rounded-lg px-3 mt-6 focus-within:border-acento transition-colors">
        <Search size={16} className="text-zinc-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar en las materias de la carrera..."
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
        />
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
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-acento border border-primario/40 bg-primario/10 rounded-full px-2.5 py-0.5">
                      Agregada
                    </span>
                    <button
                      onClick={() => quitar(materia)}
                      title="Quitar de la carrera"
                      className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
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
