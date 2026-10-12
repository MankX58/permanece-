import { motion } from 'motion/react'

const interactivos = 'button, a, input, textarea, select, label, form'

// Caja que se puede pulsar completa. Los botones, enlaces y campos de su interior siguen funcionando
// por su cuenta: un clic sobre ellos no abre la caja. Sin onClick es una caja normal.
function CajaClicable({ onClick, className = '', children, ...resto }) {
  function alPulsar(e) {
    if (!e.target.closest(interactivos)) onClick()
  }

  function alTeclear(e) {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  const accion = onClick ? { role: 'button', tabIndex: 0, onClick: alPulsar, onKeyDown: alTeclear } : {}

  return (
    <motion.div
      {...accion}
      {...resto}
      className={
        className +
        (onClick
          ? ' cursor-pointer hover:border-primario/50 hover:bg-zinc-900/60 focus-visible:outline-none focus-visible:border-acento transition-colors'
          : '')
      }
    >
      {children}
    </motion.div>
  )
}

export default CajaClicable
