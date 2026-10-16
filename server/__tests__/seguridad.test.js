import "./entorno.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

const { verificarOrigen } = await import("../middleware/origen.js");
const { emitirToken, requiereAdmin, NOMBRE_COOKIE } = await import("../middleware/auth.js");

function correr(middleware, req) {
  const res = {
    codigo: 200,
    status(c) { this.codigo = c; return this; },
    json() { return this; },
    clearCookie() { return this; },
  };
  let paso = false;
  middleware(req, res, () => { paso = true; });
  return paso ? "pasa" : res.codigo;
}
const peticion = (method, origin) => ({ method, get: (h) => (h === "origin" ? origin : undefined) });

test("Origin: bloquea cambios desde otra web, deja pasar la tienda y los GET", () => {
  assert.equal(correr(verificarOrigen, peticion("PUT", "https://evil.example")), 403);
  assert.equal(correr(verificarOrigen, peticion("POST", "https://dankar.vercel.app")), "pasa");
  assert.equal(correr(verificarOrigen, peticion("POST", undefined)), "pasa");
  assert.equal(correr(verificarOrigen, peticion("GET", "https://evil.example")), "pasa");
});

const conCookie = (token) => ({ cookies: { [NOMBRE_COOKIE]: token } });

test("sesión: el token emitido ahora es válido", () => {
  assert.equal(correr(requiereAdmin, conCookie(emitirToken())), "pasa");
});

test("sesión: un token de antes del cambio de contraseña ya no vale", () => {
  const viejo = jwt.sign({ rol: "admin", v: "huella-anterior" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  assert.equal(correr(requiereAdmin, conCookie(viejo)), 401);
  const sinHuella = jwt.sign({ rol: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  assert.equal(correr(requiereAdmin, conCookie(sinHuella)), 401);
});

test("sesión: alg none y firma ajena se rechazan", () => {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  assert.equal(correr(requiereAdmin, conCookie(`${b({ alg: "none" })}.${b({ rol: "admin" })}.`)), 401);
  const ajeno = jwt.sign({ rol: "admin" }, "otro-secreto-cualquiera-de-40-caracteres!!");
  assert.equal(correr(requiereAdmin, conCookie(ajeno)), 401);
});
