import { test } from "node:test";
import assert from "node:assert/strict";

import "./entorno.js";

const { baseDatosResponde } = await import("../datos/almacen.js");

test("sin conexión inicializada, el ping dice que no (sin colgarse ni lanzar)", async () => {
  assert.equal(await baseDatosResponde(), false);
});
