import { motion } from 'motion/react'
import { GraduationCap } from 'lucide-react'

function Cargando({ error }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={error ? {} : { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="bg-primario rounded-xl p-3"
      >
        <GraduationCap size={28} />
      </motion.div>
      <p className="text-sm text-zinc-400">{error || 'Cargando...'}</p>
    </div>
  )
}

export default Cargando
