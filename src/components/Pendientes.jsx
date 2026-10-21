import Plegable from './Plegable.jsx'

// Lo que necesita atención hoy: una fila por asunto, con un acceso directo a donde se resuelve.
// Cada elemento: { texto, boton?, destino? }. Sin elementos muestra que todo está al día.
function Pendientes({ items, irA, className = '' }) {
  return (
    <Plegable titulo="Requiere tu atención" cantidad={items.length} claseTitulo="text-base font-semibold" className={className}>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 bg-tarjeta rounded-2xl p-5">Todo está al día.</p>
      ) : (
        <ul className="bg-tarjeta rounded-2xl divide-y divide-borde">
          {items.map((item) => (
            <li key={item.texto} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3.5">
              <p className="text-sm min-w-0">{item.texto}</p>
              {item.boton && (
                <button onClick={() => irA(item.destino)} className="shrink-0 text-xs text-red-400 hover:text-red-300">
                  {item.boton} →
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Plegable>
  )
}

export default Pendientes
