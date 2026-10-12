import { fechaDeHoy } from '../fechas.js'

export const sesionVacia = { fecha: '', inicio: '', fin: '', virtual: false, lugar: '', enlace: '' }

// Pasa una asesoría del servidor al formato del formulario.
export function sesionDe(asesoria) {
  const [inicio, fin] = asesoria.horario.split(' - ')

  return {
    fecha: asesoria.fecha,
    inicio,
    fin,
    virtual: asesoria.virtual,
    lugar: asesoria.virtual ? '' : asesoria.lugar,
    enlace: asesoria.enlace || '',
  }
}

// Pasa el formulario al formato que espera el servidor.
export function datosDeSesion(valor) {
  return {
    fecha: valor.fecha,
    horario: valor.inicio + ' - ' + valor.fin,
    virtual: valor.virtual,
    lugar: valor.virtual ? 'Virtual' : valor.lugar,
    enlace: valor.virtual ? valor.enlace || null : null,
  }
}

const modalidades = [
  { virtual: false, texto: 'Presencial' },
  { virtual: true, texto: 'Virtual' },
]

// Fecha, horario y modalidad. En virtual el enlace es opcional: se puede agregar el día de la reunión.
// Se usa dentro de una grilla de dos columnas.
function CamposSesion({ valor, cambiar, className }) {
  return (
    <>
      <input
        required
        type="date"
        min={fechaDeHoy()}
        value={valor.fecha}
        onChange={(e) => cambiar('fecha', e.target.value)}
        className={className}
      />
      <div className="flex gap-3">
        <input
          required
          type="time"
          value={valor.inicio}
          onChange={(e) => cambiar('inicio', e.target.value)}
          className={className + ' flex-1'}
        />
        <input
          required
          type="time"
          min={valor.inicio}
          value={valor.fin}
          onChange={(e) => cambiar('fin', e.target.value)}
          className={className + ' flex-1'}
        />
      </div>

      <div className="flex border border-borde rounded-lg p-1">
        {modalidades.map((opcion) => (
          <button
            type="button"
            key={opcion.texto}
            onClick={() => cambiar('virtual', opcion.virtual)}
            className={
              'flex-1 px-3 py-1 rounded-md text-xs font-semibold transition-colors ' +
              (valor.virtual === opcion.virtual ? 'bg-primario text-white' : 'text-zinc-400 hover:text-white')
            }
          >
            {opcion.texto}
          </button>
        ))}
      </div>

      {valor.virtual ? (
        <input
          type="url"
          value={valor.enlace}
          onChange={(e) => cambiar('enlace', e.target.value)}
          placeholder="Enlace de la reunión (puedes agregarlo después)"
          className={className}
        />
      ) : (
        <input
          required
          value={valor.lugar}
          onChange={(e) => cambiar('lugar', e.target.value)}
          placeholder="Lugar (aula, sala, biblioteca...)"
          className={className}
        />
      )}
    </>
  )
}

export default CamposSesion
