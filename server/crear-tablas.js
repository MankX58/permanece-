import { neon } from '@neondatabase/serverless'
import { asesorias, solicitudes } from './datos-iniciales.js'

const sql = neon(process.env.DATABASE_URL)

await sql`
  CREATE TABLE IF NOT EXISTS asesorias (
    id SERIAL PRIMARY KEY,
    tutor_id TEXT,
    tutor TEXT NOT NULL,
    rol TEXT NOT NULL,
    tipo TEXT NOT NULL,
    area TEXT NOT NULL,
    materia TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha DATE NOT NULL,
    horario TEXT NOT NULL,
    lugar TEXT NOT NULL,
    virtual BOOLEAN NOT NULL DEFAULT false,
    enlace TEXT,
    cupos INTEGER NOT NULL
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS inscripciones (
    usuario_id TEXT NOT NULL,
    asesoria_id INTEGER NOT NULL REFERENCES asesorias(id) ON DELETE CASCADE,
    valoracion INTEGER,
    comentario TEXT,
    PRIMARY KEY (usuario_id, asesoria_id)
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS solicitudes (
    id SERIAL PRIMARY KEY,
    usuario_id TEXT,
    estudiante TEXT NOT NULL,
    materia TEXT NOT NULL,
    tema TEXT NOT NULL,
    urgencia TEXT NOT NULL,
    mentor_id TEXT
  )
`

// Trazabilidad de solicitudes: cuándo se pidió y cuándo el mentor la marcó como atendida.
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS creada_en TIMESTAMPTZ NOT NULL DEFAULT now()`
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS atendida_en TIMESTAMPTZ`

// Sesión individual: al agendar una solicitud se crea una asesoría privada (oculta del banco) ligada a ella.
await sql`ALTER TABLE asesorias ADD COLUMN IF NOT EXISTS privada BOOLEAN NOT NULL DEFAULT false`
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS asesoria_id INTEGER REFERENCES asesorias(id) ON DELETE SET NULL`

// Retroalimentación del mentor para los estudiantes, escrita después de la sesión.
await sql`ALTER TABLE asesorias ADD COLUMN IF NOT EXISTS resumen TEXT`

// Asistencia real: NULL = sin registrar, true = asistió, false = no asistió. Alimenta los reportes.
await sql`ALTER TABLE inscripciones ADD COLUMN IF NOT EXISTS asistio BOOLEAN`

// Coordinador de programa: su programa es una carrera del catálogo. La introducción guarda
// para qué rol ya se mostró, así reaparece si el rol cambia.
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS programa TEXT`
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS introduccion_vista TEXT`

// Carrera del propio usuario (la elige el estudiante al entrar). Es distinta de "programa", que es el que
// coordina un coordinador, y se conserva aunque cambie el rol.
await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS carrera TEXT`

// El área (Matemáticas, Física...) ya no se pide: la asesoría se agrupa por su materia y la carrera de esa
// materia en el catálogo. La columna queda solo por compatibilidad con datos viejos.
await sql`ALTER TABLE asesorias ALTER COLUMN area DROP NOT NULL`

// Materias que los coordinadores suman a su carrera, aparte del plan oficial de src/data.js.
// Puede ser una materia que ya se ve en otra carrera (mismo nombre) o una nueva.
await sql`
  CREATE TABLE IF NOT EXISTS carrera_materias (
    carrera TEXT NOT NULL,
    materia TEXT NOT NULL,
    agregada_por TEXT,
    PRIMARY KEY (carrera, materia)
  )
`
// quitada = true marca una materia del plan oficial que la coordinación sacó de la carrera (se puede restaurar).
await sql`ALTER TABLE carrera_materias ADD COLUMN IF NOT EXISTS quitada BOOLEAN NOT NULL DEFAULT false`

// Materias que puede atender cada mentor estudiante. Sin filas, el mentor atiende cualquier materia.
await sql`
  CREATE TABLE IF NOT EXISTS mentor_materias (
    mentor_id TEXT NOT NULL,
    materia TEXT NOT NULL,
    asignada_por TEXT,
    PRIMARY KEY (mentor_id, materia)
  )
`

// Horario negociado: el estudiante sugiere día y hora; el mentor puede proponer otro (propuesta), que el
// estudiante acepta o rechaza. propuesta guarda { fecha, horario, virtual, lugar, enlace }.
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS sugerida_fecha DATE`
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS sugerida_horario TEXT`
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS propuesta JSONB`

// Con cuántos compañeros más acepta el estudiante recibir la asesoría. 0 = sesión individual (privada);
// más de 0 = al agendarla se publica en el banco con 1 + companeros cupos.
await sql`ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS companeros INTEGER NOT NULL DEFAULT 0`

await sql`
  CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    texto TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false
  )
`

// A dónde lleva la notificación al abrirla: 'asesoria:ID' (su detalle) o el nombre de una página. Null = solo informa.
await sql`ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS destino TEXT`

await sql`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    rol TEXT NOT NULL DEFAULT 'estudiante'
  )
`

// Los datos de ejemplo solo se cargan si se pide explícitamente (npm run db:setup -- --con-ejemplos) y la base
// está vacía. Así correr la migración nunca rellena una base que se dejó en cero a propósito.
const conEjemplos = process.argv.includes('--con-ejemplos')
const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM asesorias`

if (conEjemplos && total === 0) {
  for (const a of asesorias) {
    await sql`
      INSERT INTO asesorias (tutor, rol, tipo, area, materia, descripcion, fecha, horario, lugar, virtual, enlace, cupos)
      VALUES (${a.tutor}, ${a.rol}, ${a.tipo}, ${a.area}, ${a.materia}, ${a.descripcion}, CURRENT_DATE + ${a.diasDesdeHoy}::int, ${a.horario}, ${a.lugar}, ${a.virtual}, ${a.enlace}, ${a.cupos})
    `
  }

  for (const s of solicitudes) {
    await sql`
      INSERT INTO solicitudes (estudiante, materia, tema, urgencia)
      VALUES (${s.estudiante}, ${s.materia}, ${s.tema}, ${s.urgencia})
    `
  }

  console.log('Tablas al día y datos de ejemplo cargados.')
} else {
  console.log('Tablas al día. No se cargaron datos de ejemplo.')
}
