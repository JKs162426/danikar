import { test } from "node:test";
import assert from "node:assert/strict";
import { negocioSchema } from "../config/esquema.js";

const negocio = { nombre: "DanKar", telefonoWhatsapp: "584121234567" };

test("sin tasa, queda en null (datos viejos de Mongo siguen cargando)", () => {
  const r = negocioSchema.parse(negocio);
  assert.equal(r.tasaBs, null);
  assert.equal(r.tasaActualizadaEn, null);
});

test("acepta una tasa positiva con su fecha", () => {
  const r = negocioSchema.parse({ ...negocio, tasaBs: 36.5, tasaActualizadaEn: "2026-10-15T15:00:00.000Z" });
  assert.equal(r.tasaBs, 36.5);
});

test("rechaza tasas en cero, negativas o que no son número", () => {
  for (const tasaBs of [0, -1, "36,50", Infinity]) {
    assert.equal(negocioSchema.safeParse({ ...negocio, tasaBs }).success, false, String(tasaBs));
  }
});
