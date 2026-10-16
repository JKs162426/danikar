import { test } from "node:test";
import assert from "node:assert/strict";

// Cada test usa una copia nueva del módulo: el estado vive en memoria.
let n = 0;
const nuevoLimitador = () => import(`../middleware/limitador.js?copia=${n++}`);

function intentar(limitarLogin, ip) {
  const res = {
    codigo: 200,
    status(c) { this.codigo = c; return this; },
    json(cuerpo) { this.cuerpo = cuerpo; return this; },
  };
  let paso = false;
  limitarLogin({ ip }, res, () => { paso = true; });
  return paso ? 200 : res.codigo;
}

test("por IP: 5 intentos pasan y el 6.º se bloquea", async () => {
  const { limitarLogin } = await nuevoLimitador();
  const codigos = Array.from({ length: 6 }, () => intentar(limitarLogin, "1.1.1.1"));
  assert.deepEqual(codigos, [200, 200, 200, 200, 200, 429]);
  assert.equal(intentar(limitarLogin, "2.2.2.2"), 200, "otra IP no se ve afectada");
});

test("el intento cuenta antes de revisar la contraseña (ráfaga simultánea)", async () => {
  const { limitarLogin } = await nuevoLimitador();
  // Sin llamar a registrarFallo, como si todas las comprobaciones siguieran en curso.
  const pasaron = Array.from({ length: 50 }, () => intentar(limitarLogin, "3.3.3.3"))
    .filter((c) => c === 200).length;
  assert.equal(pasaron, 5);
});

test("un login correcto limpia el contador de esa IP", async () => {
  const { limitarLogin, limpiarIntentos } = await nuevoLimitador();
  for (let i = 0; i < 4; i++) intentar(limitarLogin, "4.4.4.4");
  limpiarIntentos("4.4.4.4");
  const codigos = Array.from({ length: 5 }, () => intentar(limitarLogin, "4.4.4.4"));
  assert.ok(codigos.every((c) => c === 200));
});

test("tope global: frena aunque cada intento venga de una IP distinta", async () => {
  const { limitarLogin, registrarFallo } = await nuevoLimitador();
  for (let i = 0; i < 30; i++) {
    assert.equal(intentar(limitarLogin, `10.0.0.${i}`), 200);
    registrarFallo();
  }
  assert.equal(intentar(limitarLogin, "10.0.1.1"), 429);
});

test("como máximo 3 comprobaciones de contraseña a la vez", async () => {
  const { ocuparCupoComparacion } = await nuevoLimitador();
  const cupos = [1, 2, 3].map(() => ocuparCupoComparacion());
  assert.ok(cupos.every(Boolean));
  assert.equal(ocuparCupoComparacion(), null);
  cupos[0]();
  cupos[0](); // liberar dos veces no regala cupos
  assert.ok(ocuparCupoComparacion());
  assert.equal(ocuparCupoComparacion(), null);
});
