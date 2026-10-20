import { motion } from 'motion/react'
import {
  LayoutGrid,
  BookOpen,
  ClipboardList,
  CalendarDays,
  ChartColumn,
  Users,
  ShieldCheck,
  CircleHelp,
  GraduationCap,
  Library,
  UserCog,
} from 'lucide-react'

function Enlace({ id, texto, icono: Icono, pagina, setPagina }) {
  const activo = pagina === id

  return (
    <motion.button
      onClick={() => setPagina(id)}
      whileHover="encima"
      whileTap={{ scale: 0.97 }}
      className={
        'relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left ' +
        (activo ? 'text-white' : 'text-zinc-400 hover:text-white')
      }
    >
      {activo && (
        <motion.span
          layoutId="enlace-activo"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute inset-0 bg-primario rounded-lg"
        />
      )}
      <motion.span variants={{ encima: { rotate: -12, scale: 1.15 } }} className="relative">
        <Icono size={18} />
      </motion.span>
      <span className="relative">{texto}</span>
    </motion.button>
  )
}

function Sidebar({ pagina, setPagina, esMentor, esAdmin, esCoordinador }) {
  // Cada grupo corresponde a un rol; cada persona ve solo los grupos que le tocan.
  const grupos = [
    {
      titulo: 'Estudiante',
      enlaces: [
        { id: 'panel', texto: 'Panel Principal', icono: LayoutGrid },
        { id: 'banco', texto: 'Banco de Asesorías', icono: BookOpen },
        { id: 'solicitudes', texto: 'Mis Solicitudes', icono: ClipboardList },
        { id: 'calendario', texto: 'Calendario', icono: CalendarDays },
      ],
    },
  ]

  if (esMentor) {
    grupos.push({
      titulo: 'Mentor',
      enlaces: [{ id: 'mentores', texto: 'Portal de Mentores', icono: Users }],
    })
  }
  if (esAdmin || esCoordinador) {
    grupos.push({
      titulo: 'Coordinador',
      enlaces: [
        { id: 'reportes', texto: 'Reportes', icono: ChartColumn },
        { id: 'materias', texto: 'Materias', icono: Library },
        { id: 'especialidades', texto: 'Mentores y materias', icono: UserCog },
      ],
    })
  }
  if (esAdmin) {
    grupos.push({
      titulo: 'Administrador',
      enlaces: [{ id: 'usuarios', texto: 'Usuarios y Roles', icono: ShieldCheck }],
    })
  }

  // Con un solo grupo el encabezado sobra.
  const conTitulos = grupos.length > 1

  return (
    <aside className="w-60 shrink-0 border-r border-borde flex flex-col">
      <div className="flex items-center gap-2.5 px-6 h-16">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="bg-primario rounded-lg p-1.5"
        >
          <GraduationCap size={18} />
        </motion.div>
        <span className="text-lg font-bold text-acento">PERMANECE+</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {grupos.map((grupo, posicion) => (
          <div
            key={grupo.titulo}
            className={'space-y-1 ' + (posicion > 0 ? 'mt-4 pt-4 border-t border-borde' : '')}
          >
            {conTitulos && (
              <p className="px-4 pb-1 text-[10px] font-bold tracking-wider text-zinc-500">
                {grupo.titulo.toUpperCase()}
              </p>
            )}
            {grupo.enlaces.map((enlace) => (
              <Enlace key={enlace.id} {...enlace} pagina={pagina} setPagina={setPagina} />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-borde p-3">
        <Enlace id="ayuda" texto="Centro de Ayuda" icono={CircleHelp} pagina={pagina} setPagina={setPagina} />
      </div>
    </aside>
  )
}

export default Sidebar
