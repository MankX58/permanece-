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
  Lock,
  GraduationCap,
  Library,
  UserCog,
} from 'lucide-react'

function Enlace({ id, texto, icono: Icono, pagina, setPagina }) {
  const activo = pagina === id

  return (
    <motion.button
      onClick={() => setPagina(id)}
      className={
        'relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ' +
        (activo ? 'text-white font-medium' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]')
      }
    >
      {activo && (
        <motion.span
          layoutId="enlace-activo"
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-primario/15 rounded-lg"
        />
      )}
      <span className={'relative ' + (activo ? 'text-acento' : '')}>
        <Icono size={17} />
      </span>
      <span className="relative">{texto}</span>
    </motion.button>
  )
}

function Sidebar({ abierto, pagina, setPagina, esMentor, esDocente, esAdmin, esCoordinador }) {
  // Cada grupo corresponde a un rol; cada persona ve solo los grupos que le tocan.
  // Admin y coordinador no ven el grupo de estudiante: no piden asesorías. El docente solo da asesorías.
  const grupos = []
  if (esDocente) {
    grupos.push({
      titulo: 'Docente',
      enlaces: [
        { id: 'panel', texto: 'Panel principal', icono: LayoutGrid },
        { id: 'calendario', texto: 'Calendario', icono: CalendarDays },
        { id: 'mentores', texto: 'Portal de mentores', icono: Users },
      ],
    })
  } else if (!esAdmin && !esCoordinador) {
    grupos.push({
      titulo: 'Estudiante',
      enlaces: [
        { id: 'panel', texto: 'Panel principal', icono: LayoutGrid },
        { id: 'banco', texto: 'Banco de asesorías', icono: BookOpen },
        { id: 'solicitudes', texto: 'Mis solicitudes', icono: ClipboardList },
        { id: 'calendario', texto: 'Calendario', icono: CalendarDays },
      ],
    })
  }

  if (esMentor && !esDocente) {
    grupos.push({
      titulo: 'Mentor',
      enlaces: [{ id: 'mentores', texto: 'Portal de mentores', icono: Users }],
    })
  }
  if (esAdmin || esCoordinador) {
    grupos.push({
      titulo: 'Coordinador',
      enlaces: [
        { id: 'panel', texto: 'Panel principal', icono: LayoutGrid },
        { id: 'reportes', texto: 'Reportes', icono: ChartColumn },
        { id: 'materias', texto: 'Materias', icono: Library },
        { id: 'especialidades', texto: 'Mentores y materias', icono: UserCog },
      ],
    })
  }
  if (esAdmin) {
    grupos.push({
      titulo: 'Administrador',
      enlaces: [{ id: 'usuarios', texto: 'Usuarios y roles', icono: ShieldCheck }],
    })
  }

  // Con un solo grupo el encabezado sobra.
  const conTitulos = grupos.length > 1

  return (
    <aside
      className={
        'fixed inset-y-0 left-0 z-40 w-60 bg-fondo border-r border-borde flex flex-col transition-transform duration-200 ' +
        'lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 ' +
        (abierto ? 'translate-x-0' : '-translate-x-full')
      }
    >
      <div className="flex items-center gap-2.5 px-6 h-16">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="bg-primario rounded-lg p-1.5"
        >
          <GraduationCap size={18} />
        </motion.div>
        <span className="text-base font-semibold">Permanece<span className="text-acento">+</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {grupos.map((grupo, posicion) => (
          <div
            key={grupo.titulo}
            className={'space-y-1 ' + (posicion > 0 ? 'mt-4 pt-4 border-t border-borde' : '')}
          >
            {conTitulos && (
              <p className="px-3 pb-1 text-xs text-zinc-500">{grupo.titulo}</p>
            )}
            {grupo.enlaces.map((enlace) => (
              <Enlace key={enlace.id} {...enlace} pagina={pagina} setPagina={setPagina} />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-borde p-3 space-y-1">
        <Enlace id="privacidad" texto="Política de privacidad" icono={Lock} pagina={pagina} setPagina={setPagina} />
        <Enlace id="ayuda" texto="Centro de ayuda" icono={CircleHelp} pagina={pagina} setPagina={setPagina} />
      </div>
    </aside>
  )
}

export default Sidebar
