import { politica, CONTACTO_PRIVACIDAD } from '../privacidad.js'

// El mismo texto se usa en la ventana de autorización y en la página de la política.
function TextoPolitica() {
  return (
    <div className="space-y-5 text-sm text-zinc-300">
      {politica.map((seccion) => (
        <section key={seccion.titulo}>
          <h3 className="text-sm font-semibold text-white mb-1.5">{seccion.titulo}</h3>
          {seccion.parrafos?.map((parrafo) => (
            <p key={parrafo} className="text-zinc-400 leading-relaxed mb-1.5">
              {parrafo}
            </p>
          ))}
          {seccion.lista && (
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 leading-relaxed">
              {seccion.lista.map((elemento) => (
                <li key={elemento}>{elemento}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <p className="text-zinc-400 leading-relaxed">
        {CONTACTO_PRIVACIDAD
          ? 'Para ejercer tus derechos escribe a ' + CONTACTO_PRIVACIDAD + '.'
          : 'Para ejercer tus derechos, comunícate con el equipo del proyecto o con el administrador de la plataforma.'}
      </p>
    </div>
  )
}

export default TextoPolitica
