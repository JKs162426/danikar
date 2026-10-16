import { test } from "node:test";
import assert from "node:assert/strict";

// Cada test usa una copia nueva del módulo: el estado vive en memoria.
let n = 0;
const nuevoLimitador = () => import(`../middleware/limitador.js?copia=${n++}`);

// Como en producción: req.ip es un balanceador interno que cambia en cada
// petición, y la IP real llega en CF-Connecting-IP.
let balanceador = 0;
const peticion = (ip, vercel) => ({
  ip: `10.199.0.${balanceador++ % 250}`,
  get: (h) =>
    ({ "cf-connecting-ip": ip, "x-vercel-forwarded-for": vercel })[h],
});

function intentar(limitarLogin, ip, vercel) {
  const res = {
    codigo: 200,
    status(c) { this.codigo = c; return this; },
    json(cuerpo) { this.cuerpo = cuerpo; return this; },
  };
  let paso = false;
  limitarLogin(peticion(ip, vercel), res, () => { paso = true; });
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
  limpiarIntentos(peticion("4.4.4.4"));
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

test("sin Cloudflare (desarrollo local) usa req.ip", async () => {
  const { ipConfiable } = await import("../middleware/ip.js");
  assert.equal(ipConfiable({ ip: "::1", get: () => undefined }), "::1");
  assert.equal(ipConfiable({ ip: "::1", get: () => "no-es-una-ip" }), "::1");
  assert.equal(ipConfiable({ ip: "10.0.0.1", get: () => " 97.178.199.123 " }), "97.178.199.123");
});

test("por Vercel: frena a la persona por su IP real aunque cambie la salida de Vercel", async () => {
  const { limitarLogin } = await nuevoLimitador();
  const salidas = ["54.153.45.66", "18.144.5.215", "13.52.241.13"];
  const codigos = Array.from({ length: 6 }, (_, i) =>
    intentar(limitarLogin, salidas[i % 3], "97.178.199.123"));
  assert.deepEqual(codigos, [200, 200, 200, 200, 200, 429]);
});

test("por Vercel: los fallos de otros en la misma salida no bloquean a la dueña", async () => {
  const { limitarLogin } = await nuevoLimitador();
  for (const atacante of ["1.1.1.1", "2.2.2.2", "3.3.3.3"]) {
    for (let i = 0; i < 5; i++) intentar(limitarLogin, "54.153.45.66", atacante);
  }
  assert.equal(intentar(limitarLogin, "54.153.45.66", "190.0.0.7"), 200);
});

test("cabecera de Vercel inventada (directo o por un nodo que la deja pasar): la IP de Cloudflare igual frena", async () => {
  const { limitarLogin } = await nuevoLimitador();
  const pasaron = Array.from({ length: 40 }, (_, i) =>
    intentar(limitarLogin, "97.178.199.123", `6.6.6.${i}`)).filter((c) => c === 200).length;
  assert.equal(pasaron, 20);
});
