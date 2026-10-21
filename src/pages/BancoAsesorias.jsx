import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, EyeOff, SlidersHorizontal } from 'lucide-react'
import TarjetaAsesoria from '../components/TarjetaAsesoria.jsx'
import { item, desplegar } from '../animaciones.js'

const tipos = ['Todos', 'Docente', 'Voluntario']

function BancoAsesorias({
  asesorias,
  inscribir,
  cancelar,
  abrirDetalle,
  catalogo,
  carreraInicial = '',
  carreraFija = false,
  busquedaInicial = '',
}) {
  const [busqueda, setBusqueda] = useState(busquedaInicial)
  const [tipo, setTipo] = useState('Todos')
  // Las asesorías se agrupan por la carrera de su materia (catálogo). El estudiante arranca con la suya.
  const [carrera, setCarrera] = useState(carreraInicial)
  const [tutor, setTutor] = useState('')
  const [modalidad, setModalidad] = useState('')
  // Las asesorías que publicó el propio mentor o docente arrancan ocultas; en Filtros puede mostrarlas.
  const [ocultarMias, setOcultarMias] = useState(true)
  const [masFiltros, setMasFiltros] = useState(false)
  const tieneMias = asesorias.some((asesoria) => asesoria.esMia && !asesoria.pasada)

  const tutores = []
  asesorias.forEach((asesoria) => {
    if (!tutores.includes(asesoria.tutor)) {
      tutores.push(asesoria.tutor)
    }
  })

  const resultados = asesorias.filter((asesoria) => {
    if (asesoria.pasada) return false
    if (ocultarMias && asesoria.esMia) return false
    const texto = (asesoria.materia + ' ' + asesoria.descripcion + ' ' + asesoria.tutor).toLowerCase()
    if (!texto.includes(busqueda.toLowerCase())) return false
    if (tipo !== 'Todos' && asesoria.tipo !== tipo) return false
    if (carrera !== '' && !catalogo.find((c) => c.nombre === carrera)?.materias.includes(asesoria.materia)) return false
    if (tutor !== '' && asesoria.tutor !== tutor) return false
    if (modalidad !== '' && (modalidad === 'Virtual') !== asesoria.virtual) return false
    return true
  })

  const claseSelect = 'bg-tarjeta rounded-lg px-3 py-2 text-sm'
  // Los filtros secundarios van plegados; el número avisa cuántos están puestos.
  const filtrosActivos = [modalidad !== '', tutor !== '', tipo !== 'Todos', ocultarMias && tieneMias].filter(Boolean).length

  return (
    <div>
      <h1 className="text-2xl font-semibold text-red-400">Banco de asesorías</h1>
      {carreraFija && <p className="text-sm text-zinc-400 mt-1">{carrera}</p>}

      <div className="flex flex-wrap items-center gap-3 mt-6">
        <div className="flex-1 min-w-56 flex items-center gap-2.5 bg-tarjeta rounded-lg px-3 focus-within:outline focus-within:outline-2 focus-within:outline-acento/60 transition-colors">
          <Search size={16} className="text-zinc-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por materia, tema o docente..."
            className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-zinc-400"
          />
        </div>

        {!carreraFija && (
          <select value={carrera} onChange={(e) => setCarrera(e.target.value)} className={claseSelect + ' max-w-60'}>
            <option value="">Todas las carreras</option>
            {catalogo.map((opcion) => (
              <option key={opcion.nombre}>{opcion.nombre}</option>
            ))}
          </select>
        )}

        <button
          onClick={() => setMasFiltros(!masFiltros)}
          aria-expanded={masFiltros}
          className={
            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ' +
            (masFiltros || filtrosActivos > 0 ? 'bg-zinc-800 text-white' : 'bg-tarjeta text-zinc-400 hover:text-white')
          }
        >
          <SlidersHorizontal size={15} />
          Filtros
          {filtrosActivos > 0 && <span className="text-xs bg-primario rounded-full px-1.5">{filtrosActivos}</span>}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {masFiltros && (
          <motion.div {...desplegar} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <select value={modalidad} onChange={(e) => setModalidad(e.target.value)} className={claseSelect}>
                <option value="">Cualquier modalidad</option>
                <option>Presencial</option>
                <option>Virtual</option>
              </select>

              <select value={tutor} onChange={(e) => setTutor(e.target.value)} className={claseSelect}>
                <option value="">Cualquier profesor o mentor</option>
                {tutores.map((opcion) => (
                  <option key={opcion}>{opcion}</option>
                ))}
              </select>

              <div className="flex bg-tarjeta rounded-lg p-1">
                {tipos.map((opcion) => (
                  <button
                    key={opcion}
                    onClick={() => setTipo(opcion)}
                    className={
                      'px-3 py-1 rounded-md text-xs transition-colors ' +
                      (tipo === opcion ? 'bg-primario/20 text-red-200' : 'text-zinc-400 hover:text-white')
                    }
                  >
                    {opcion}
                  </button>
                ))}
              </div>

              {tieneMias && (
                <button
                  onClick={() => setOcultarMias(!ocultarMias)}
                  aria-pressed={ocultarMias}
                  className={
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ' +
                    (ocultarMias ? 'bg-primario/20 text-red-200' : 'bg-tarjeta text-zinc-400 hover:text-white')
                  }
                >
                  <EyeOff size={14} />
                  Ocultar las mías
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
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
          className="text-center text-sm text-zinc-400 mt-12"
        >
          No se encontraron asesorías.
        </motion.p>
      )}
    </div>
  )
}

export default BancoAsesorias
