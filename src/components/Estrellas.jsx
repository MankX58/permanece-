import { motion } from 'motion/react'
import { Star } from 'lucide-react'

function Estrellas({ cantidad, alCambiar }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.span
          key={n}
          onClick={alCambiar ? () => alCambiar(n) : undefined}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16, delay: n * 0.05 }}
          whileHover={alCambiar ? { scale: 1.3 } : undefined}
          whileTap={alCambiar ? { scale: 0.8, rotate: 20 } : undefined}
          className={alCambiar ? 'cursor-pointer' : ''}
        >
          <Star
            size={16}
            className={n <= cantidad ? 'text-acento fill-acento' : 'text-zinc-600 fill-zinc-600'}
          />
        </motion.span>
      ))}
    </div>
  )
}

export default Estrellas
