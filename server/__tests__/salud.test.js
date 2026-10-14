import { test, mock } from "node:test";
import assert from "node:assert/strict";
import express from "express";

// Estado simulado del almacén: así se prueba la ruta sin MongoDB real.
const estado = { iniciado: true, dbOk: true };
mock.module("../datos/almacen.js", {
  namedExports: {
    leerContenido: () => {
      if (!estado.iniciado) throw new Error("El almacén no fue inicializado.");
      return { productos: [] };
    },
    baseDatosResponde: async () => estado.dbOk,
  },
});
const { default: salud } = await import("../rutas/salud.js");

async function pedirSalud() {
  const app = express().use("/api/salud", salud);
  const servidor = app.listen(0);
  try {
    const { port } = servidor.address();
    const res = await fetch(`http://localhost:${port}/api/salud`);
    return { estado: res.status, cache: res.headers.get("cache-control"), cuerpo: await res.json() };
  } finally {
    servidor.close();
  }
}

test("responde 200 con la base de datos sana", async () => {
  Object.assign(estado, { iniciado: true, dbOk: true });
  const r = await pedirSalud();
  assert.equal(r.estado, 200);
  assert.deepEqual(r.cuerpo, { ok: true, baseDatos: "ok" });
  assert.equal(r.cache, "no-store");
});

test("sigue en 200 si MongoDB no responde: la tienda sirve desde memoria", async () => {
  Object.assign(estado, { iniciado: true, dbOk: false });
  const r = await pedirSalud();
  assert.equal(r.estado, 200);
  assert.equal(r.cuerpo.baseDatos, "sin respuesta");
});

test("503 si el catálogo no está cargado", async () => {
  Object.assign(estado, { iniciado: false, dbOk: true });
  const r = await pedirSalud();
  assert.equal(r.estado, 503);
  assert.equal(r.cuerpo.ok, false);
});
