import { useMemo, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const LIMITE = 40

// materia -> carreras donde se cursa, para listar cada materia una sola vez.
function indexar(carreras) {
  const carrerasDe = new Map()
  carreras.forEach((carrera) => {
    carrera.materias.forEach((materia) => {
      if (!carrerasDe.has(materia)) carrerasDe.set(materia, [])
      carrerasDe.get(materia).push(carrera.nombre)
    })
  })
  const todas = [...carrerasDe.keys()].sort((a, b) => a.localeCompare(b, 'es'))
  return { carrerasDe, todas }
}

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function carreraGuardada(carreras) {
  try {
    const nombre = localStorage.getItem('carrera-materias')
    return carreras.some((carrera) => carrera.nombre === nombre) ? nombre : ''
  } catch {
    return ''
  }
}

function etiquetaCarreras(nombres) {
  return nombres.length <= 2 ? nombres.join(' · ') : nombres[0] + ' · +' + (nombres.length - 1)
}

// Combo de búsqueda: el valor solo puede ser una materia del catálogo vigente (incluye las que agregó coordinación).
function SelectorMateria({ catalogo: carreras, value, onChange, className = '' }) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [carrera, setCarrera] = useState(() => carreraGuardada(carreras))
  const entrada = useRef(null)
  const { carrerasDe, todas } = useMemo(() => indexar(carreras), [carreras])

  const buscado = normalizar(texto)
  const base = carrera ? carreras.find((c) => c.nombre === carrera).materias : todas
  const resultados = base.filter(
    (materia) =>
      normalizar(materia).includes(buscado) ||
      (!carrera && carrerasDe.get(materia).some((nombre) => normalizar(nombre).includes(buscado)))
  )
  const visibles = resultados.slice(0, LIMITE)

  function elegir(materia) {
    onChange(materia)
    setAbierto(false)
  }

  function cambiarCarrera(nombre) {
    setCarrera(nombre)
    try {
      localStorage.setItem('carrera-materias', nombre)
    } catch {
      // sin almacenamiento: la carrera solo dura mientras la página está abierta
    }
    entrada.current.focus()
  }

  function alSalir(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setAbierto(false)
    }
  }

  function teclas(e) {
    if (e.key === 'Escape') {
      setAbierto(false)
    } else if (e.key === 'Enter' && e.target === entrada.current && abierto) {
      e.preventDefault()
      if (visibles.length > 0) elegir(visibles[0])
    }
  }

  return (
    <div className="relative" onBlur={alSalir} onKeyDown={teclas}>
      <input
        ref={entrada}
        required
        value={abierto ? texto : value}
        placeholder={value || 'Busca tu materia'}
        onFocus={() => {
          if (!abierto) {
            setTexto('')
            setAbierto(true)
          }
        }}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
        className={'w-full ' + className}
      />

      {abierto && (
        <div className="absolute z-20 mt-1 w-full bg-tarjeta border border-borde rounded-lg shadow-lg [color-scheme:dark]">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-borde">
            <span className="text-xs text-zinc-500 shrink-0">Carrera</span>
            <select
              value={carrera}
              onChange={(e) => cambiarCarrera(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
            >
              <option value="">Todas</option>
              {carreras.map((c) => (
                <option key={c.nombre}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div onMouseDown={(e) => e.preventDefault()} className="max-h-56 overflow-y-auto py-1">
            {visibles.length === 0 && (
              <p className="px-3 py-3 text-sm text-zinc-500">
                Sin resultados{carrera ? '. Prueba con «Todas» las carreras.' : '.'}
              </p>
            )}

            {visibles.map((materia) => (
              <button
                type="button"
                key={materia}
                onClick={() => elegir(materia)}
                className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left hover:bg-zinc-800 focus:bg-zinc-800 outline-none"
              >
                <span className="min-w-0">
                  <span className="block text-sm">{materia}</span>
                  {!carrera && (
                    <span className="block truncate text-[11px] text-zinc-500">
                      {etiquetaCarreras(carrerasDe.get(materia))}
                    </span>
                  )}
                </span>
                {materia === value && <Check size={14} className="shrink-0 text-acento" />}
              </button>
            ))}

            {resultados.length > LIMITE && (
              <p className="px-3 py-2 text-xs text-zinc-500">
                {resultados.length - LIMITE} más. Sigue escribiendo o elige una carrera.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SelectorMateria
