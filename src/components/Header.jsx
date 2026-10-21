import { useState, useEffect, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { motion, AnimatePresence } from 'motion/react'
import { Bell, LogOut, X, ChevronRight } from 'lucide-react'

function Header({ yo, notificaciones, marcarLeidas, borrar, abrir }) {
  const { user, logout } = useAuth0()
  const [abierto, setAbierto] = useState(false)
  const campana = useRef(null)
  const hayNuevas = notificaciones.length > 0

  // Un clic fuera del panel lo cierra.
  useEffect(() => {
    if (!abierto) return
    function fuera(evento) {
      if (!campana.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  function abrirNotificacion(notificacion) {
    setAbierto(false)
    abrir(notificacion)
  }

  return (
    <header className="h-16 shrink-0 border-b border-borde flex items-center justify-end gap-5 px-8">
      <div className="relative" ref={campana}>
        <motion.button
          onClick={() => setAbierto(!abierto)}
          whileTap={{ scale: 0.9 }}
          title="Notificaciones"
          className="relative block text-zinc-300 hover:text-white"
        >
          <Bell size={20} />
          <AnimatePresence>
            {hayNuevas && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 bg-acento text-black text-[10px] font-semibold leading-4 text-center rounded-full"
              >
                {notificaciones.length > 9 ? '9+' : notificaciones.length}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {abierto && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-9 w-80 bg-tarjeta border border-borde rounded-xl shadow-lg z-10"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-borde">
                <p className="text-sm font-semibold">Notificaciones</p>
                {hayNuevas && (
                  <button onClick={marcarLeidas} className="text-xs text-zinc-400 hover:text-white">
                    Borrar todas
                  </button>
                )}
              </div>
              {!hayNuevas && <p className="text-sm text-zinc-500 px-4 py-6 text-center">Estás al día.</p>}
              <ul className="max-h-96 overflow-y-auto p-1.5">
                <AnimatePresence initial={false}>
                  {notificaciones.map((notificacion) => (
                    <motion.li
                      key={notificacion.id}
                      layout
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="group flex items-start rounded-lg hover:bg-white/5"
                    >
                      {notificacion.destino ? (
                        <button
                          onClick={() => abrirNotificacion(notificacion)}
                          className="flex-1 min-w-0 flex items-start gap-1.5 text-left text-[13px] leading-snug text-zinc-300 py-2 pl-3"
                        >
                          <span className="flex-1">{notificacion.texto}</span>
                          <ChevronRight size={14} className="mt-0.5 shrink-0 text-zinc-500 group-hover:text-acento" />
                        </button>
                      ) : (
                        <p className="flex-1 min-w-0 text-[13px] leading-snug text-zinc-300 py-2 pl-3">
                          {notificacion.texto}
                        </p>
                      )}
                      <button
                        onClick={() => borrar(notificacion.id)}
                        title="Borrar"
                        className="shrink-0 p-2 text-zinc-600 hover:text-white group-hover:text-zinc-400"
                      >
                        <X size={14} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
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
          <p className="text-xs text-zinc-400">
            <span className="capitalize">{yo.rol}</span>
            {yo.rol === 'estudiante' && yo.carrera && <span> · {yo.carrera}</span>}
          </p>
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
