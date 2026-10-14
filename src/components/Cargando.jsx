import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'motion/react'
import { GraduationCap, LogOut, RotateCw } from 'lucide-react'

// Si la carga falla (por ejemplo, la sesión expiró) o tarda demasiado, ofrece salir o reintentar
// en vez de dejar a la persona atrapada en la pantalla de carga.
const ESPERA_MAXIMA = 10000

function Cargando({ error }) {
  const { logout, isAuthenticated } = useAuth0()
  const [tardando, setTardando] = useState(false)

  useEffect(() => {
    const espera = setTimeout(() => setTardando(true), ESPERA_MAXIMA)
    return () => clearTimeout(espera)
  }, [])

  const atascado = Boolean(error) || tardando

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <motion.div
        animate={error ? {} : { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="bg-primario rounded-xl p-3"
      >
        <GraduationCap size={28} />
      </motion.div>

      <p className={'text-sm max-w-sm ' + (error ? 'text-acento' : 'text-zinc-400')}>
        {error || (tardando ? 'Esto está tardando más de lo normal.' : 'Cargando...')}
      </p>

      {atascado && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-2"
        >
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 border border-borde hover:bg-zinc-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <RotateCw size={15} />
            Reintentar
          </button>
          {isAuthenticated && (
            <button
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              className="flex items-center gap-2 bg-primario hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            >
              <LogOut size={15} />
              Cerrar sesión
            </button>
          )}
        </motion.div>
      )}

      {error && isAuthenticated && (
        <p className="text-xs text-zinc-500 max-w-sm">
          Si tu sesión expiró, cierra sesión y vuelve a entrar con tu cuenta.
        </p>
      )}
    </div>
  )
}

export default Cargando
