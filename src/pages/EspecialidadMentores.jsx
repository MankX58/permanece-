import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, Plus } from 'lucide-react'
import SelectorMateria from '../components/SelectorMateria.jsx'
import { lista, item, desplegar } from '../animaciones.js'

// Mentores y docentes solo atienden las materias que se les asignan; sin materias no atienden ninguna.
// El coordinador asigna y quita solo materias de su programa; el admin, cualquiera.
const filtros = [
  { id: 'todos', texto: 'Todos', cumple: () => true },
  { id: 'mentor', texto: 'Mentores', cumple: (p) => p.rol === 'mentor' },
  { id: 'docente', texto: 'Docentes', cumple: (p) => p.rol === 'docente' },
  { id: 'sin', texto: 'Sin materias', cumple: (p) => p.materias.length === 0 },
]

function iniciales(nombre) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((palabra) => palabra[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function EspecialidadMentores({ yo, mentores, catalogo, asignar, quitar }) {
  const esCoordinador = yo.rol === 'coordinador'
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [abierto, setAbierto] = useState(null)

  const programa = esCoordinador ? catalogo.find((carrera) => carrera.nombre === yo.programa) : null
  const catalogoPermitido = esCoordinador ? (programa ? [programa] : []) : catalogo
  const puedeQuitar = (materia) => !esCoordinador || Boolean(programa?.materias.includes(materia))

  const texto = busqueda.toLowerCase()
  const cumpleFiltro = filtros.find((f) => f.id === filtro).cumple
  const visibles = mentores.filter(
    (persona) =>
      cumpleFiltro(persona) &&
      (persona.nombre + ' ' + (persona.email || '') + ' ' + persona.materias.join(' ')).toLowerCase().includes(texto)
  )

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-red-400">Mentores y materias</h1>

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <div className="flex-1 min-w-48 flex items-center gap-2 border border-borde rounded-full px-3.5 focus-within:border-acento transition-colors">
          <Search size={15} className="text-zinc-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <div className="flex gap-1 bg-tarjeta border border-borde rounded-full p-1">
          {filtros.map((opcion) => {
            const cuantos = mentores.filter(opcion.cumple).length
            const activo = filtro === opcion.id
            return (
              <button
                key={opcion.id}
                onClick={() => setFiltro(opcion.id)}
                className={
                  'relative px-3 py-1 rounded-full text-xs font-semibold transition-colors ' +
                  (activo ? 'text-white' : 'text-zinc-400 hover:text-white')
                }
              >
                {activo && (
                  <motion.span
                    layoutId="filtro-mentores"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 bg-zinc-700 rounded-full"
                  />
                )}
                <span className="relative">
                  {opcion.texto} <span className="opacity-60">{cuantos}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {esCoordinador && !programa && (
        <p className="text-sm text-acento mt-6">Aún no tienes un programa asignado.</p>
      )}
      {mentores.length === 0 && (
        <p className="text-sm text-zinc-400 mt-6">Aún no hay mentores ni docentes.</p>
      )}
      {mentores.length > 0 && visibles.length === 0 && <p className="text-sm text-zinc-400 mt-6">Sin resultados.</p>}

      <motion.div variants={lista} initial="oculto" animate="visible" className="space-y-2 mt-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibles.map((persona) => {
            const desplegado = abierto === persona.id
            return (
              <motion.div
                key={persona.id}
                layout
                variants={item}
                exit="salida"
                className={
                  'bg-tarjeta rounded-xl px-3 py-2.5 transition-colors ' +
                  (desplegado ? 'relative z-10 bg-zinc-900' : 'hover:bg-zinc-900')
                }
              >
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                  <div className="relative shrink-0 size-9 rounded-full bg-zinc-800 text-xs font-semibold flex items-center justify-center">
                    {iniciales(persona.nombre)}
                    {persona.materias.length === 0 && (
                      <span
                        title="Sin materias: no puede atender"
                        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-acento ring-2 ring-tarjeta"
                      />
                    )}
                  </div>

                  <div className="flex-1 sm:flex-none sm:w-40 min-w-0">
                    <p className="text-sm font-semibold truncate">{persona.nombre}</p>
                    <p className="text-[11px] text-zinc-400">
                      {persona.rol === 'docente' ? 'Docente' : 'Mentor'}
                    </p>
                  </div>

                  <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
                    <AnimatePresence initial={false}>
                      {persona.materias.map((materia) => {
                        const propia = puedeQuitar(materia)
                        return (
                          <motion.span
                            key={materia}
                            layout
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            title={propia ? undefined : 'De otro programa'}
                            className={
                              'group flex items-center gap-1 text-xs rounded-full pl-2.5 py-0.5 border ' +
                              (propia
                                ? 'pr-1 text-zinc-200 bg-fondo border-borde'
                                : 'pr-2.5 text-zinc-400 border-dashed border-borde')
                            }
                          >
                            {materia}
                            {propia && (
                              <button
                                onClick={() => quitar(persona.id, materia)}
                                aria-label={'Quitar ' + materia}
                                className="p-0.5 rounded-full text-zinc-500 group-hover:text-zinc-300 hover:!text-acento hover:bg-zinc-800 transition-colors"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </motion.span>
                        )
                      })}
                    </AnimatePresence>
                    {persona.materias.length === 0 && <span className="text-xs text-zinc-500">Sin materias</span>}
                  </div>

                  {catalogoPermitido.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setAbierto(desplegado ? null : persona.id)}
                      aria-label={desplegado ? 'Cerrar' : 'Asignar materia'}
                      className={
                        'shrink-0 size-8 rounded-full flex items-center justify-center transition-colors ' +
                        (desplegado ? 'bg-primario text-white' : 'bg-zinc-800 text-zinc-300 hover:text-white')
                      }
                    >
                      <motion.span animate={{ rotate: desplegado ? 45 : 0 }} className="flex">
                        <Plus size={16} />
                      </motion.span>
                    </motion.button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {desplegado && (
                    <motion.div {...desplegar}>
                      <div className="pt-2.5 pl-12 pr-11">
                        <SelectorMateria
                          catalogo={catalogoPermitido}
                          value=""
                          onChange={(materia) => asignar(persona.id, materia)}
                          className="bg-fondo border border-borde rounded-lg px-3 py-1.5 text-sm outline-none focus:border-acento"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default EspecialidadMentores
