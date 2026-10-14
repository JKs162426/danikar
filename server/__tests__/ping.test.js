import { test } from "node:test";
import assert from "node:assert/strict";

// almacen.js importa config.js, que exige estas variables al cargar.
process.env.JWT_SECRET ??= "x".repeat(32);
process.env.ADMIN_PASSWORD_HASH ??= "hash-de-prueba";
process.env.MONGODB_URI ??= "mongodb://localhost:1/nada";

const { baseDatosResponde } = await import("../datos/almacen.js");

test("sin conexión inicializada, el ping dice que no (sin colgarse ni lanzar)", async () => {
  assert.equal(await baseDatosResponde(), false);
});
