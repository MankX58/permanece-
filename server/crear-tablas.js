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

await sql`
  CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    texto TEXT NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    rol TEXT NOT NULL DEFAULT 'estudiante'
  )
`

const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM asesorias`

if (total === 0) {
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

  console.log('Tablas creadas y datos de ejemplo cargados.')
} else {
  console.log('Las tablas ya tenían datos, no se cargó nada.')
}
