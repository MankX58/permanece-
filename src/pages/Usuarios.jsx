import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import { carreras } from '../data.js'
import { item } from '../animaciones.js'

const roles = ['estudiante', 'mentor', 'docente', 'coordinador', 'admin']
const filtros = [
  { id: 'todos', texto: 'Todos' },
  { id: 'estudiante', texto: 'Estudiantes' },
  { id: 'mentor', texto: 'Mentores' },
  { id: 'docente', texto: 'Docentes' },
  { id: 'coordinador', texto: 'Coordinadores' },
  { id: 'admin', texto: 'Admins' },
]

function Usuarios({ yo, usuarios, cambiarRol, cambiarCarrera }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todos')

  const texto = busqueda.toLowerCase()
  const visibles = usuarios.filter(
    (usuario) =>
      (filtro === 'todos' || usuario.rol === filtro) &&
      (usuario.nombre + ' ' + (usuario.email || '')).toLowerCase().includes(texto)
  )

  function cuantos(id) {
    return id === 'todos' ? usuarios.length : usuarios.filter((usuario) => usuario.rol === id).length
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold text-red-400">Usuarios y roles</h1>

      <div className="flex items-center gap-2.5 border border-borde rounded-lg px-3 mt-6 focus-within:border-acento transition-colors">
        <Search size={16} className="text-zinc-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>

      <div className="flex flex-wrap gap-x-5 border-b border-borde mt-4">
        {filtros.map((opcion) => (
          <button
            key={opcion.id}
            onClick={() => setFiltro(opcion.id)}
            className={
              'relative pb-2 text-sm font-medium transition-colors ' +
              (filtro === opcion.id ? 'text-white' : 'text-zinc-400 hover:text-zinc-300')
            }
          >
            {opcion.texto} <span className="text-xs text-zinc-400 ml-0.5">{cuantos(opcion.id)}</span>
            {filtro === opcion.id && (
              <motion.span
                layoutId="filtro-usuarios"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="absolute inset-x-0 -bottom-px h-px bg-acento"
              />
            )}
          </button>
        ))}
      </div>

      {visibles.length === 0 && <p className="text-sm text-zinc-400 mt-4">No hay usuarios con ese criterio.</p>}

      <div className="divide-y divide-borde">
        <AnimatePresence mode="popLayout">
          {visibles.map((usuario) => (
            <motion.div
              key={usuario.id}
              layout
              variants={item}
              initial="oculto"
              animate="visible"
              exit="salida"
              className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{usuario.nombre}</p>
                <p className="text-xs text-zinc-400 truncate">
                  {usuario.email}
                  {usuario.carrera && <span className="text-zinc-400"> · {usuario.carrera}</span>}
                </p>
              </div>
              {usuario.id === yo.id ? (
                <span className="text-xs text-zinc-400 capitalize shrink-0">{usuario.rol} (tú)</span>
              ) : (
                <div className="flex flex-wrap items-center sm:justify-end gap-2 sm:shrink-0">
                  {['estudiante', 'mentor', 'docente'].includes(usuario.rol) && (
                    <select
                      value={usuario.carrera || ''}
                      onChange={(e) => cambiarCarrera(usuario.id, e.target.value)}
                      title="Carrera"
                      className={
                        'bg-fondo border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-acento max-w-52 ' +
                        (usuario.carrera ? 'border-borde' : 'border-primario text-acento')
                      }
                    >
                      <option value="" disabled>
                        Sin carrera
                      </option>
                      {carreras.map((carrera) => (
                        <option key={carrera.nombre}>{carrera.nombre}</option>
                      ))}
                    </select>
                  )}
                  {usuario.rol === 'coordinador' && (
                    <select
                      value={usuario.programa || ''}
                      onChange={(e) => cambiarRol(usuario.id, 'coordinador', e.target.value)}
                      className={
                        'bg-fondo border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-acento max-w-52 ' +
                        (usuario.programa ? 'border-borde' : 'border-primario text-acento')
                      }
                    >
                      <option value="">Asignar programa…</option>
                      {carreras.map((carrera) => (
                        <option key={carrera.nombre}>{carrera.nombre}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={usuario.rol}
                    onChange={(e) => cambiarRol(usuario.id, e.target.value)}
                    className="bg-fondo border border-borde rounded-lg px-2.5 py-1.5 text-xs capitalize outline-none focus:border-acento"
                  >
                    {roles.map((rol) => (
                      <option key={rol}>{rol}</option>
                    ))}
                  </select>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Usuarios
