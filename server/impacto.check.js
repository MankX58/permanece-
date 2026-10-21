// Comprobación rápida del cálculo de impacto: node server/impacto.check.js
import assert from 'node:assert/strict'
import { calcularImpacto } from './impacto.js'

const f = (atendido, anterior, actual) => ({ atendido, anterior, actual })

// Atendidos: suben en promedio y dos de tres salen del riesgo. No atendidos: casi no cambian.
const r = calcularImpacto([
  f(true, 2.5, 3.2), f(true, 2.8, 3.1), f(true, 3.0, 3.4), f(true, 2.9, 2.9),
  f(false, 3.0, 3.0), f(false, 2.6, 2.7), f(false, 3.5, 3.4), f(false, null, 3.0),
  f(false, null, null),
])

assert.equal(r.atendidos.estudiantes, 4)
assert.equal(r.atendidos.promedio, 3.15)
assert.equal(r.atendidos.cambio, 0.35)
assert.equal(r.atendidos.pctEnRiesgo, 0.25)
assert.equal(r.atendidos.estabanEnRiesgo, 3)
assert.equal(r.atendidos.pctSalieron, 0.667)

assert.equal(r.noAtendidos.estudiantes, 5)
assert.equal(r.noAtendidos.conPromedio, 4)
assert.equal(r.noAtendidos.conCambio, 3)
assert.equal(r.noAtendidos.cambio, 0)
assert.equal(r.noAtendidos.estabanEnRiesgo, null) // solo 1 persona: no se publica
assert.equal(r.noAtendidos.pctSalieron, null)

// Un grupo de menos de 3 personas no publica cifras.
const pocos = calcularImpacto([f(true, 2.5, 3.2), f(true, 2.8, 3.1)])
assert.equal(pocos.atendidos.promedio, null)
assert.equal(pocos.atendidos.pctEnRiesgo, null)

// Sin datos no falla.
assert.equal(calcularImpacto([]).total.promedio, null)

console.log('impacto: ok')
