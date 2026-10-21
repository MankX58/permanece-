import TextoPolitica from '../components/TextoPolitica.jsx'
import { VERSION_POLITICA } from '../privacidad.js'

function PoliticaPrivacidad() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Política de privacidad</h1>
      <p className="text-sm text-zinc-400 mt-1">
        Tratamiento de datos personales según la Ley 1581 de 2012 · versión {VERSION_POLITICA}
      </p>
      <div className="bg-tarjeta rounded-xl p-6 mt-6">
        <TextoPolitica />
      </div>
    </div>
  )
}

export default PoliticaPrivacidad
