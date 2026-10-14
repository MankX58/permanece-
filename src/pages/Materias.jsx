import { useState } from 'react'

function Materias({ yo, catalogo, agregarMateria }) {
  const esCoordinador = yo.rol === 'coordinador'
  const [elegida, setElegida] = useState(catalogo[0]?.nombre || '')
  const [existente, setExistente] = useState('')
  const [nueva, setNueva] = useState('')

  // El coordinador solo ve su programa; el admin elige cualquiera.
  const carrera = catalogo.find((c) => c.nombre === (esCoordinador ? yo.programa : elegida))

  if (!carrera) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">Materias</h1>
        <p className="text-sm text-zinc-400 mt-4">Aún no tienes un programa asignado.</p>
      </div>
    )
  }

  // Materias de otras carreras que todavía no están en esta.
  const deOtras = [...new Set(catalogo.flatMap((c) => c.materias))]
    .filter((materia) => !carrera.materias.includes(materia))
    .sort((a, b) => a.localeCompare(b, 'es'))

  async function agregarExistente() {
    if (existente && (await agregarMateria(carrera.nombre, existente))) setExistente('')
  }

  async function crearNueva(e) {
    e.preventDefault()
    if (nueva.trim() && (await agregarMateria(carrera.nombre, nueva))) setNueva('')
  }

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento'
  const claseBoton = 'bg-primario hover:bg-red-700 text-sm font-semibold px-4 py-2 rounded-lg'

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold">Materias</h1>

      {!esCoordinador && (
        <select value={elegida} onChange={(e) => setElegida(e.target.value)} className={claseCampo + ' mt-4'}>
          {catalogo.map((c) => (
            <option key={c.nombre}>{c.nombre}</option>
          ))}
        </select>
      )}

      <div className="bg-tarjeta border border-borde rounded-xl p-4 mt-4 space-y-3">
        <p className="text-sm font-semibold">Agregar materia a {carrera.nombre}</p>

        <div className="flex gap-2">
          <select value={existente} onChange={(e) => setExistente(e.target.value)} className={claseCampo + ' flex-1 min-w-0'}>
            <option value="">Materia de otra carrera...</option>
            {deOtras.map((materia) => (
              <option key={materia}>{materia}</option>
            ))}
          </select>
          <button onClick={agregarExistente} className={claseBoton}>
            Agregar
          </button>
        </div>

        <form onSubmit={crearNueva} className="flex gap-2">
          <input
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            placeholder="O escribe una materia nueva"
            className={claseCampo + ' flex-1 min-w-0'}
          />
          <button className={claseBoton}>Crear</button>
        </form>
      </div>

      <p className="text-sm text-zinc-400 mt-6">{carrera.materias.length} materias</p>
      <ul className="mt-2 divide-y divide-borde">
        {carrera.materias.map((materia) => (
          <li key={materia} className="py-2 text-sm">
            {materia}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Materias
