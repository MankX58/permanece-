// Dos formas calmadas de mostrar cifras sin una caja grande por número.

// Cifras en una sola línea de texto: "4 estudiantes ayudados · 4.0 horas impartidas".
export function EnLinea({ datos, className = '' }) {
  return (
    <p className={'flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-400 ' + className}>
      {datos.map((dato) => (
        <span key={dato.etiqueta}>
          <strong className="text-red-400 font-semibold tabular-nums">{dato.valor}</strong> {dato.etiqueta}
        </span>
      ))}
    </p>
  )
}

// Una lista dentro de una sola tarjeta: nombre, cifra y detalle por fila, en dos columnas cuando hay espacio.
export function ListaDatos({ datos }) {
  return (
    <dl className="bg-tarjeta rounded-2xl px-5 grid lg:grid-cols-2 lg:gap-x-12">
      {datos.map((dato) => (
        <div
          key={dato.etiqueta}
          className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-3 border-b border-borde last:border-0 lg:[&:nth-last-child(2):nth-child(odd)]:border-0"
        >
          <dt className="text-sm text-zinc-300">{dato.etiqueta}</dt>
          <dd className="text-lg font-semibold tabular-nums text-right text-red-400">{dato.valor}</dd>
          <dd className="col-span-2 text-xs text-zinc-400 mt-0.5">{dato.detalle}</dd>
        </div>
      ))}
    </dl>
  )
}
