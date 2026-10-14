import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Plus, Sparkles, Pencil, Trash2, RotateCcw, ChevronDown, Layers } from 'lucide-react'
import { item, toque, desplegar } from '../animaciones.js'

const COMUNES = '__comunes__'

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

// "Ingeniería de Sistemas" -> "Ing. Sistemas", para que las etiquetas quepan.
function corto(nombre) {
  return nombre.replace(/^Ingeniería (de )?/, 'Ing. ').replace(/^Comunicación /, 'Com. ')
}

function plural(n, uno, varios) {
  return n + ' ' + (n === 1 ? uno : varios)
}

function textoUso(uso) {
  if (!uso) return null
  const partes = []
  if (uso.asesorias > 0) partes.push(plural(uso.asesorias, 'asesoría', 'asesorías'))
  if (uso.proximas > 0) partes.push(plural(uso.proximas, 'próxima', 'próximas'))
  if (uso.pendientes > 0) partes.push(plural(uso.pendientes, 'solicitud pendiente', 'solicitudes pendientes'))
  return partes.length > 0 ? partes.join(' · ') : 'Sin uso todavía'
}

// Etiquetas de las carreras donde también se ve la materia: hasta 3 y "+n", con la lista completa al pasar el cursor.
function Carreras({ nombres, todas = false }) {
  const visibles = todas ? nombres : nombres.slice(0, 3)
  const resto = nombres.length - visibles.length

  return (
    <span className="flex flex-wrap gap-1.5" title={nombres.join('\n')}>
      {visibles.map((nombre) => (
        <span key={nombre} className="text-[11px] text-zinc-300 bg-fondo border border-borde rounded-md px-2 py-0.5">
          {corto(nombre)}
        </span>
      ))}
      {resto > 0 && <span className="text-[11px] text-zinc-500 px-1 py-0.5">+{resto}</span>}
    </span>
  )
}

// Formulario para cambiar el nombre. Explica antes de guardar qué va a pasar con las otras carreras y el historial.
function Renombrar({ materia, carrera, otras, uso, conocidas, puedeEnTodas, fijoEnTodas, guardar, cancelar }) {
  const [texto, setTexto] = useState(materia)
  const [enTodas, setEnTodas] = useState(Boolean(fijoEnTodas))

  const limpio = texto.replace(/\s+/g, ' ').trim()
  const coincide = conocidas.find((nombre) => nombre !== materia && normalizar(nombre) === normalizar(limpio))
  const compartida = otras.length > 0
  const conHistorial = !compartida || enTodas
  const valido = limpio.length >= 3 && limpio !== materia

  let explicacion
  if (conHistorial) {
    explicacion =
      'Cambia en ' +
      (compartida ? 'todas las carreras que la tienen' : carrera) +
      ' y también en ' +
      (uso?.asesorias ? plural(uso.asesorias, 'asesoría registrada', 'asesorías registradas') : 'el historial') +
      ', para no perder la trazabilidad.'
  } else {
    explicacion =
      'Solo cambia en ' + carrera + '. ' + otras.map(corto).join(', ') + ' conservan «' + materia +
      '», y las asesorías ya registradas siguen con ese nombre.'
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (valido) guardar(limpio, enTodas)
      }}
      className="mt-3 bg-fondo border border-borde rounded-xl p-3"
    >
      <div className="flex gap-2">
        <input
          autoFocus
          value={texto}
          maxLength={120}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && cancelar()}
          className="min-w-0 flex-1 bg-tarjeta border border-borde rounded-lg px-3 py-1.5 text-sm outline-none focus:border-acento"
        />
        <motion.button
          {...toque}
          disabled={!valido}
          className="bg-primario hover:bg-red-700 disabled:opacity-40 rounded-lg px-3.5 text-xs font-semibold"
        >
          Guardar
        </motion.button>
        <button type="button" onClick={cancelar} className="text-xs font-medium text-zinc-400 hover:text-white px-1">
          Cancelar
        </button>
      </div>

      {compartida && puedeEnTodas && !fijoEnTodas && (
        <label className="flex items-center gap-2 text-xs text-zinc-300 mt-3 cursor-pointer">
          <input type="checkbox" checked={enTodas} onChange={(e) => setEnTodas(e.target.checked)} />
          Cambiar también en {otras.map(corto).join(', ')}
        </label>
      )}

      {valido && (
        <p className="text-xs text-zinc-500 mt-2">
          {coincide && <span className="text-acento">Ya existe «{coincide}»: se unificará con esa materia. </span>}
          {explicacion}
        </p>
      )}
    </form>
  )
}

function Materias({ yo, api, catalogo, agregarMateria, quitarMateria, renombrarMateria }) {
  const esCoordinador = yo.rol === 'coordinador'
  const esAdmin = yo.rol === 'admin'
  const [elegida, setElegida] = useState(catalogo[0]?.nombre || '')
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [nueva, setNueva] = useState('')
  const [editando, setEditando] = useState(null)
  const [uso, setUso] = useState({})
  const [verQuitadas, setVerQuitadas] = useState(false)

  // El coordinador solo ve su programa; el admin elige una carrera o la vista de materias comunes.
  const nombreCarrera = esCoordinador ? yo.programa : elegida
  const vistaComunes = !esCoordinador && elegida === COMUNES
  const carrera = catalogo.find((c) => c.nombre === nombreCarrera)

  // materia -> carreras donde está vigente.
  const carrerasDe = useMemo(() => {
    const mapa = new Map()
    catalogo.forEach((c) =>
      c.materias.forEach((materia) => {
        if (!mapa.has(materia)) mapa.set(materia, [])
        mapa.get(materia).push(c.nombre)
      })
    )
    return mapa
  }, [catalogo])
  const conocidas = useMemo(() => [...carrerasDe.keys()].sort((a, b) => a.localeCompare(b, 'es')), [carrerasDe])

  // Uso de cada materia (asesorías, próximas, solicitudes pendientes). Se recarga si cambian las materias.
  const firma = carrera ? carrera.materias.join('|') + '#' + carrera.quitadas.join('|') : ''
  useEffect(() => {
    if (!carrera) return
    let vigente = true
    api('/materias/uso?carrera=' + encodeURIComponent(carrera.nombre))
      .then((datos) => vigente && setUso(datos))
      .catch(() => vigente && setUso({}))
    return () => {
      vigente = false
    }
  }, [nombreCarrera, firma])

  const claseCampo = 'bg-fondo border border-borde rounded-lg px-3 py-2 text-sm outline-none focus:border-acento transition-colors'
  const buscado = normalizar(busqueda)
  const coincideBusqueda = (materia) => normalizar(materia).includes(buscado)

  const encabezado = (
    <>
      <h1 className="text-2xl font-bold">Materias</h1>
      <p className="text-sm text-zinc-400 mt-1">
        {esCoordinador
          ? 'Las materias de tu programa: ' + (yo.programa || 'sin asignar') + '. Puedes agregar, renombrar y quitar.'
          : 'El plan oficial de cada carrera con los ajustes de coordinación.'}
      </p>

      {!esCoordinador && (
        <select value={elegida} onChange={(e) => setElegida(e.target.value)} className={claseCampo + ' mt-6'}>
          <option value={COMUNES}>Materias comunes entre carreras</option>
          {catalogo.map((c) => (
            <option key={c.nombre}>{c.nombre}</option>
          ))}
        </select>
      )}
    </>
  )

  const buscador = (
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
  )

  // ------------------------------------------------------------ Vista de materias comunes (solo admin)
  if (vistaComunes) {
    const grupos = new Map()
    carrerasDe.forEach((nombres, materia) => {
      if (nombres.length < 2 || !coincideBusqueda(materia)) return
      if (!grupos.has(nombres.length)) grupos.set(nombres.length, [])
      grupos.get(nombres.length).push(materia)
    })
    const ordenados = [...grupos.entries()].sort((a, b) => b[0] - a[0])
    const total = [...carrerasDe.values()].filter((nombres) => nombres.length > 1).length

    return (
      <div className="max-w-4xl">
        {encabezado}

        <p className="text-sm text-zinc-400 mt-6 flex items-center gap-2">
          <Layers size={16} className="text-acento" />
          {total} materias se ven en dos o más carreras. Cuentan en los reportes de cada una.
        </p>
        <div className="flex mt-4">{buscador}</div>

        {ordenados.length === 0 && <p className="text-sm text-zinc-500 mt-6">No hay materias comunes con ese nombre.</p>}

        {ordenados.map(([cuantas, materias]) => (
          <section key={cuantas} className="mt-8">
            <h2 className="text-xs font-bold tracking-wider text-zinc-500 mb-3">
              EN {cuantas} CARRERAS · {materias.length}
            </h2>
            <div className="space-y-2">
              {materias
                .sort((a, b) => a.localeCompare(b, 'es'))
                .map((materia) => {
                  const nombres = carrerasDe.get(materia)
                  const clave = COMUNES + materia
                  return (
                    <div key={materia} className="bg-tarjeta border border-borde rounded-xl p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{materia}</p>
                          <div className="mt-2">
                            <Carreras nombres={nombres} todas />
                          </div>
                        </div>
                        <button
                          onClick={() => setEditando(editando === clave ? null : clave)}
                          title="Renombrar en todas las carreras"
                          className="shrink-0 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                      {editando === clave && (
                        <Renombrar
                          materia={materia}
                          carrera={nombres[0]}
                          otras={nombres.slice(1)}
                          conocidas={conocidas}
                          puedeEnTodas
                          fijoEnTodas
                          cancelar={() => setEditando(null)}
                          guardar={async (nuevo) => {
                            if (await renombrarMateria(nombres[0], materia, nuevo, true)) setEditando(null)
                          }}
                        />
                      )}
                    </div>
                  )
                })}
            </div>
          </section>
        ))}
      </div>
    )
  }

  if (!carrera) {
    return (
      <div className="max-w-4xl">
        {encabezado}
        <p className="text-sm text-acento bg-primario/10 border border-primario/30 rounded-xl p-4 mt-6">
          Aún no tienes un programa asignado. Pídele al administrador que lo asigne.
        </p>
      </div>
    )
  }

  // ------------------------------------------------------------ Vista de una carrera
  const otrasDe = (materia) => (carrerasDe.get(materia) || []).filter((nombre) => nombre !== carrera.nombre)
  const comunes = carrera.materias
    .filter((materia) => otrasDe(materia).length > 0)
    .sort((a, b) => otrasDe(b).length - otrasDe(a).length || a.localeCompare(b, 'es'))
  const propias = carrera.materias
    .filter((materia) => otrasDe(materia).length === 0)
    .sort((a, b) => a.localeCompare(b, 'es'))

  const filtros = [
    { id: 'todas', texto: 'Todas', lista: carrera.materias },
    { id: 'comunes', texto: 'Comunes', lista: comunes },
    { id: 'propias', texto: 'Solo aquí', lista: propias },
    { id: 'agregadas', texto: 'Agregadas', lista: carrera.agregadas },
  ]

  // Agregar: materias de otras carreras que aún no están en esta, o una nueva si no existe en ninguna.
  const textoNuevo = nueva.replace(/\s+/g, ' ').trim()
  const buscadoNuevo = normalizar(textoNuevo)
  const sugerencias = conocidas
    .filter((materia) => !carrera.materias.includes(materia) && normalizar(materia).includes(buscadoNuevo))
    .slice(0, 8)
  const quitadaQueCoincide = carrera.quitadas.find((materia) => normalizar(materia).includes(buscadoNuevo))
  const yaEsta = carrera.materias.some((materia) => normalizar(materia) === buscadoNuevo)
  const existe =
    conocidas.some((materia) => normalizar(materia) === buscadoNuevo) ||
    carrera.quitadas.some((materia) => normalizar(materia) === buscadoNuevo)

  async function agregar(materia) {
    if (await agregarMateria(carrera.nombre, materia)) setNueva('')
  }

  function alEnviar(e) {
    e.preventDefault()
    if (textoNuevo.length < 3 || yaEsta) return
    const exacta = [...conocidas, ...carrera.quitadas].find((materia) => normalizar(materia) === buscadoNuevo)
    agregar(exacta || textoNuevo)
  }

  function quitar(materia) {
    const datos = uso[materia]
    const otras = otrasDe(materia)
    const avisos = [
      '¿Quitar «' + materia + '» de ' + carrera.nombre + '?',
      'Ya no se podrá elegir en esta carrera al pedir o publicar asesorías.' +
        (otras.length > 0 ? ' Sigue disponible en ' + otras.map(corto).join(', ') + '.' : ''),
    ]
    if (datos?.proximas === 1) avisos.push('Su asesoría próxima sigue publicada.')
    if (datos?.proximas > 1) avisos.push('Sus ' + datos.proximas + ' asesorías próximas siguen publicadas.')
    avisos.push('El historial no se borra y puedes ' + (carrera.agregadas.includes(materia) ? 'volver a agregarla.' : 'restaurarla después.'))

    if (window.confirm(avisos.join('\n\n'))) quitarMateria(carrera.nombre, materia)
  }

  function fila(materia) {
    const otras = otrasDe(materia)
    const agregada = carrera.agregadas.includes(materia)
    const clave = carrera.nombre + materia

    return (
      <motion.div
        key={clave}
        layout
        variants={item}
        initial="oculto"
        animate="visible"
        exit="salida"
        className="bg-tarjeta border border-borde rounded-xl px-4 py-3"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{materia}</span>
              {agregada && (
                <span className="text-[10px] font-bold tracking-wide text-acento border border-primario/40 bg-primario/10 rounded-full px-2 py-0.5">
                  AGREGADA
                </span>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-1.5">
              {otras.length > 0 && <Carreras nombres={otras} />}
              <span className="text-xs text-zinc-500">{textoUso(uso[materia])}</span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <button
              onClick={() => setEditando(editando === clave ? null : clave)}
              title="Renombrar"
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => quitar(materia)}
              title="Quitar de la carrera"
              className="p-1.5 rounded-md text-zinc-500 hover:text-acento hover:bg-zinc-800"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {editando === clave && (
          <Renombrar
            materia={materia}
            carrera={carrera.nombre}
            otras={otras}
            uso={uso[materia]}
            conocidas={conocidas}
            puedeEnTodas={esAdmin}
            cancelar={() => setEditando(null)}
            guardar={async (nuevo, enTodas) => {
              if (await renombrarMateria(carrera.nombre, materia, nuevo, enTodas)) setEditando(null)
            }}
          />
        )}
      </motion.div>
    )
  }

  function seccion(titulo, descripcion, lista) {
    const visibles = lista.filter(coincideBusqueda)
    if (visibles.length === 0) return null

    return (
      <section className="mt-8">
        <h2 className="text-xs font-bold tracking-wider text-zinc-500">
          {titulo.toUpperCase()} · {visibles.length}
        </h2>
        {descripcion && <p className="text-xs text-zinc-500 mt-1">{descripcion}</p>}
        <div className="space-y-2 mt-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibles.map(fila)}
          </AnimatePresence>
        </div>
      </section>
    )
  }

  const listaFiltrada = filtros.find((f) => f.id === filtro).lista
  const sinResultados = listaFiltrada.filter(coincideBusqueda).length === 0

  return (
    <div className="max-w-4xl">
      {encabezado}

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
            {quitadaQueCoincide && (
              <button
                type="button"
                onClick={() => agregar(quitadaQueCoincide)}
                className="w-full flex items-center justify-between gap-3 py-2 text-left group"
              >
                <span className="min-w-0">
                  <span className="block text-sm">{quitadaQueCoincide}</span>
                  <span className="block text-[11px] text-zinc-500">Del plan oficial, quitada de esta carrera</span>
                </span>
                <RotateCcw size={16} className="shrink-0 text-zinc-500 group-hover:text-acento" />
              </button>
            )}
            {sugerencias.map((materia) => (
              <button
                key={materia}
                type="button"
                onClick={() => agregar(materia)}
                className="w-full flex items-center justify-between gap-3 py-2 text-left group"
              >
                <span className="min-w-0">
                  <span className="block text-sm">{materia}</span>
                  <span className="block truncate text-[11px] text-zinc-500">
                    En {(carrerasDe.get(materia) || []).map(corto).join(' · ')}
                  </span>
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

      <div className="flex flex-wrap items-center gap-3 mt-8">
        {buscador}
        <div className="flex flex-wrap gap-2">
          {filtros.map((opcion) => (
            <button
              key={opcion.id}
              onClick={() => setFiltro(opcion.id)}
              className={
                'text-xs font-bold px-3.5 py-1.5 rounded-full border transition-colors ' +
                (filtro === opcion.id
                  ? 'bg-acento border-acento text-white'
                  : 'bg-tarjeta border-borde text-zinc-400 hover:text-white')
              }
            >
              {opcion.texto} <span className="opacity-70">{opcion.lista.length}</span>
            </button>
          ))}
        </div>
      </div>

      {sinResultados && <p className="text-sm text-zinc-500 mt-6">No hay materias con ese criterio.</p>}

      {filtro === 'todas' ? (
        <>
          {seccion(
            'Comunes con otras carreras',
            'Se ven en varias carreras y cuentan en los reportes de cada una. Ordenadas de la más compartida a la menos.',
            comunes
          )}
          {seccion('Solo en ' + carrera.nombre, null, propias)}
        </>
      ) : (
        seccion(filtros.find((f) => f.id === filtro).texto, null, listaFiltrada)
      )}

      {carrera.quitadas.length > 0 && (
        <section className="mt-10 border-t border-borde pt-6">
          <button
            onClick={() => setVerQuitadas(!verQuitadas)}
            className="flex items-center gap-2 text-xs font-bold tracking-wider text-zinc-500 hover:text-white"
          >
            QUITADAS DEL PLAN OFICIAL · {carrera.quitadas.length}
            <motion.span animate={{ rotate: verQuitadas ? 180 : 0 }} className="flex">
              <ChevronDown size={14} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {verQuitadas && (
              <motion.div {...desplegar} className="overflow-hidden">
                <div className="space-y-2 mt-3">
                  {carrera.quitadas.map((materia) => (
                    <div
                      key={materia}
                      className="flex items-center justify-between gap-4 bg-tarjeta border border-dashed border-borde rounded-xl px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-400 line-through decoration-zinc-600">{materia}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{textoUso(uso[materia])}</p>
                      </div>
                      <button
                        onClick={() => agregarMateria(carrera.nombre, materia)}
                        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white border border-borde rounded-lg px-3 py-1.5"
                      >
                        <RotateCcw size={13} />
                        Restaurar
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  )
}

export default Materias
