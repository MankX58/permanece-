import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import TarjetaAsesoria from '../components/TarjetaAsesoria.jsx'
import { item } from '../animaciones.js'

const tipos = ['Todos', 'Docente', 'Voluntario']

function BancoAsesorias({ asesorias, inscribir, cancelar, abrirDetalle, catalogo, carreraInicial = '', busquedaInicial = '' }) {
  const [busqueda, setBusqueda] = useState(busquedaInicial)
  const [tipo, setTipo] = useState('Todos')
  // Las asesorías se agrupan por la carrera de su materia (catálogo). El estudiante arranca con la suya.
  const [carrera, setCarrera] = useState(carreraInicial)
  const [tutor, setTutor] = useState('')
  const [modalidad, setModalidad] = useState('')

  const tutores = []
  asesorias.forEach((asesoria) => {
    if (!tutores.includes(asesoria.tutor)) {
      tutores.push(asesoria.tutor)
    }
  })

  const resultados = asesorias.filter((asesoria) => {
    if (asesoria.pasada) return false
    const texto = (asesoria.materia + ' ' + asesoria.descripcion + ' ' + asesoria.tutor).toLowerCase()
    if (!texto.includes(busqueda.toLowerCase())) return false
    if (tipo !== 'Todos' && asesoria.tipo !== tipo) return false
    if (carrera !== '' && !catalogo.find((c) => c.nombre === carrera)?.materias.includes(asesoria.materia)) return false
    if (tutor !== '' && asesoria.tutor !== tutor) return false
    if (modalidad !== '' && (modalidad === 'Virtual') !== asesoria.virtual) return false
    return true
  })

  const claseSelect = 'bg-tarjeta border border-borde rounded-lg px-3 py-2 text-sm'

  return (
    <div>
      <h1 className="text-2xl font-bold">Banco de Asesorías</h1>
      <p className="text-sm text-zinc-400 mt-1">Encuentra sesiones disponibles e inscríbete.</p>

      <div className="flex flex-col xl:flex-row gap-3 bg-tarjeta border border-borde rounded-xl p-2.5 mt-6">
        <div className="flex-1 flex items-center gap-2.5 border border-borde rounded-lg px-3 focus-within:border-acento transition-colors">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por materia, tema o docente..."
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-500"
          />
        </div>

        <select value={carrera} onChange={(e) => setCarrera(e.target.value)} className={claseSelect + ' max-w-60'}>
          <option value="">Todas las carreras</option>
          {catalogo.map((opcion) => (
            <option key={opcion.nombre}>{opcion.nombre}</option>
          ))}
        </select>

        <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className={claseSelect}>
          <option value="">Modalidad</option>
          <option>Presencial</option>
          <option>Virtual</option>
        </select>

        <select value={tutor} onChange={(e) => setTutor(e.target.value)} className={claseSelect}>
          <option value="">Profesor / Mentor</option>
          {tutores.map((opcion) => (
            <option key={opcion}>{opcion}</option>
          ))}
        </select>

        <div className="flex border border-borde rounded-lg p-1">
          {tipos.map((opcion) => (
            <button
              key={opcion}
              onClick={() => setTipo(opcion)}
              className={
                'relative flex-1 px-3 py-1 rounded-md text-xs font-semibold ' +
                (tipo === opcion ? 'text-white' : 'text-zinc-300 hover:text-white')
              }
            >
              {tipo === opcion && (
                <motion.span
                  layoutId="tipo-activo"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-primario rounded-md"
                />
              )}
              <span className="relative">{opcion}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        <AnimatePresence mode="popLayout">
          {resultados.map((asesoria, posicion) => (
            <motion.div
              key={asesoria.id}
              layout
              variants={item}
              initial="oculto"
              animate="visible"
              exit="salida"
              transition={{ delay: posicion * 0.05 }}
            >
              <TarjetaAsesoria
                asesoria={asesoria}
                inscribir={inscribir}
                cancelar={cancelar}
                abrirDetalle={abrirDetalle}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {resultados.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-zinc-500 mt-12"
        >
          No se encontraron asesorías.
        </motion.p>
      )}
    </div>
  )
}

export default BancoAsesorias
