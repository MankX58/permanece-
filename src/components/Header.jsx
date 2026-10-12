import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, LogOut } from 'lucide-react'
import { lista, item } from '../animaciones.js'

function Header({ yo, notificaciones, marcarLeidas }) {
  const { user, logout } = useAuth0()
  const [abierto, setAbierto] = useState(false)
  const hayNuevas = notificaciones.length > 0

  return (
    <header className="h-16 shrink-0 border-b border-borde flex items-center justify-end gap-5 px-8">
      <div className="relative">
        <motion.button
          onClick={() => setAbierto(!abierto)}
          whileTap={{ scale: 0.9 }}
          animate={hayNuevas ? { rotate: [0, -18, 14, -10, 6, 0] } : { rotate: 0 }}
          transition={{ duration: 0.7, repeat: hayNuevas ? Infinity : 0, repeatDelay: 4 }}
          className="relative block text-zinc-300 hover:text-white"
        >
          <Bell size={20} />
          <AnimatePresence>
            {hayNuevas && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-acento rounded-full"
              />
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {abierto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              style={{ transformOrigin: 'top right' }}
              className="absolute right-0 top-9 w-72 bg-tarjeta border border-borde rounded-xl p-4 z-10"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Notificaciones</p>
                {hayNuevas && (
                  <button onClick={marcarLeidas} className="text-xs text-acento hover:underline">
                    Marcar como leídas
                  </button>
                )}
              </div>
              {!hayNuevas && <p className="text-sm text-zinc-500">No tienes notificaciones.</p>}
              <motion.div variants={lista} initial="oculto" animate="visible">
                {notificaciones.map((notificacion) => (
                  <motion.p
                    key={notificacion.id}
                    variants={item}
                    className="text-sm text-zinc-300 border-t border-borde py-2.5"
                  >
                    {notificacion.texto}
                  </motion.p>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 border-l border-borde pl-5">
        <motion.img
          src={user.picture}
          alt=""
          whileHover={{ scale: 1.12, rotate: 6 }}
          className="w-8 h-8 rounded-full"
        />
        <div>
          <p className="text-sm font-semibold leading-tight">{yo.nombre}</p>
          <p className="text-xs text-zinc-400 capitalize">{yo.rol}</p>
        </div>
        <motion.button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.9 }}
          title="Cerrar sesión"
          className="text-zinc-400 hover:text-white ml-1"
        >
          <LogOut size={18} />
        </motion.button>
      </div>
    </header>
  )
}

export default Header
