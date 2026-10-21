// Movimiento corto y sin rebotes: solo acompaña lo que aparece o se pulsa.
export const resorte = { duration: 0.2, ease: [0.22, 1, 0.36, 1] }

export const toque = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.12 },
}

export const lista = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.025 } },
}

export const item = {
  oculto: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: resorte },
  salida: { opacity: 0, transition: { duration: 0.12 } },
}

export const desplegar = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
}
