export const resorte = { type: 'spring', stiffness: 320, damping: 28 }

export const toque = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 500, damping: 28 },
}

export const lista = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export const item = {
  oculto: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: resorte },
  salida: { opacity: 0, scale: 0.92, transition: { duration: 0.18 } },
}

export const desplegar = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { type: 'spring', stiffness: 260, damping: 30 },
}
