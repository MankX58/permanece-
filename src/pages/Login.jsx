import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'motion/react'
import { GraduationCap } from 'lucide-react'
import { toque } from '../animaciones.js'

function Login() {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="relative h-screen flex items-center justify-center p-6 overflow-hidden">
      <motion.div
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-80 h-80 bg-primario/25 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -70, 50, 0], y: [0, 50, -30, 0], scale: [1, 0.85, 1.15, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-acento/15 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative bg-tarjeta/80 backdrop-blur border border-borde rounded-2xl p-8 w-full max-w-sm text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.2 }}
          className="inline-block bg-primario rounded-xl p-2.5"
        >
          <GraduationCap size={28} />
        </motion.div>
        <h1 className="text-2xl font-bold text-acento mt-4">PERMANECE+</h1>
        <p className="text-sm text-zinc-400 mt-2">Inicia sesión para ver tus asesorías.</p>
        <motion.button
          {...toque}
          onClick={() => loginWithRedirect()}
          className="w-full bg-primario hover:bg-red-700 text-sm font-semibold py-2.5 rounded-lg mt-6"
        >
          Iniciar sesión
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Login
