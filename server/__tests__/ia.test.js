import { test } from "node:test";
import assert from "node:assert/strict";
import {
  construirMensajes,
  generarDescripcion,
  imagenParaIa,
  limpiarRespuesta,
  pedidoSchema,
} from "../ia/descripcion.js";

const negocio = { nombre: "Detalles DanKar", ubicacion: "Pariaguán, Venezuela" };
const foto = "https://res.cloudinary.com/demo/image/upload/v1/dankar/lazo.jpg";
const producto = pedidoSchema.parse({
  nombre: "Lazo clásico",
  categoria: "lazos",
  colores: ["Rojo", "Fucsia"],
  variantes: [{ tamano: "Pequeño", precio: 3 }, { tamano: "Mediano", precio: 5 }],
  tipoAgarre: "pinza",
  personalizable: true,
  imagenes: [foto],
});
const config = { clave: "clave-de-prueba", url: "https://ia.test/v1", modelo: "llama-3.3-70b-versatile", vision: false };

// fetch falso: responde lo que se le diga y guarda lo que se le pidió.
function fetchFalso(...respuestas) {
  const llamadas = [];
  const fn = async (url, opciones) => {
    llamadas.push(JSON.parse(opciones.body));
    const r = respuestas[Math.min(llamadas.length - 1, respuestas.length - 1)];
    if (r instanceof Error) throw r;
    return { ok: r.status < 400, status: r.status, json: async () => r.cuerpo };
  };
  fn.llamadas = llamadas;
  return fn;
}
const exito = (texto) => ({ status: 200, cuerpo: { choices: [{ message: { content: texto } }] } });

test("el pedido no lleva precios: cambian y la descripción quedaría vieja", () => {
  assert.deepEqual(producto.variantes, [{ tamano: "Pequeño" }, { tamano: "Mediano" }]);
  const { mensajes } = construirMensajes(producto, negocio, { conFotos: false });
  assert.doesNotMatch(JSON.stringify(mensajes), /\$|precio: [0-9]/);
});

test("el mensaje lleva los datos del producto y las reglas del tono", () => {
  const { mensajes, usaFotos } = construirMensajes(producto, negocio, { conFotos: false });
  assert.equal(usaFotos, false);
  assert.match(mensajes[0].content, /Detalles DanKar/);
  assert.match(mensajes[0].content, /No inventes materiales/);
  assert.equal(typeof mensajes[1].content, "string");
  for (const dato of ["Lazo clásico", "Rojo, Fucsia", "Pequeño, Mediano", "pinza", "Personalizable: sí"]) {
    assert.ok(mensajes[1].content.includes(dato), dato);
  }
});

test("con un modelo de visión, adjunta las fotos achicadas", () => {
  const { mensajes, usaFotos } = construirMensajes(producto, negocio, { conFotos: true });
  assert.equal(usaFotos, true);
  const partes = mensajes[1].content;
  assert.equal(partes[0].type, "text");
  assert.equal(partes[1].image_url.url, "https://res.cloudinary.com/demo/image/upload/w_768,h_768,c_limit,q_auto,f_jpg/v1/dankar/lazo.jpg");
});

test("solo acepta fotos de Cloudinary", () => {
  assert.equal(imagenParaIa("https://evil.example/x.jpg"), null);
  assert.equal(imagenParaIa("/imagenes/viejo.png"), null);
  assert.ok(imagenParaIa(foto));
});

test("limpia comillas, etiquetas y espacios de la respuesta", () => {
  assert.equal(limpiarRespuesta('  "Descripción: Un lazo   hecho a mano."  '), "Un lazo hecho a mano.");
  assert.equal(limpiarRespuesta("«Lindo lazo.»"), "Lindo lazo.");
  const larga = "Una oración. ".repeat(200);
  const recortada = limpiarRespuesta(larga);
  assert.ok(recortada.length <= 1000 && recortada.endsWith("."));
});

test("genera la descripción con el modelo configurado", async () => {
  const fetchImpl = fetchFalso(exito("Un lazo de doble capa, hecho a mano."));
  const r = await generarDescripcion({ producto, negocio, config, fetchImpl });
  assert.deepEqual(r, { descripcion: "Un lazo de doble capa, hecho a mano.", modelo: "llama-3.3-70b-versatile", usaFotos: false });
  assert.equal(fetchImpl.llamadas[0].model, "llama-3.3-70b-versatile");
});

test("sin clave: 503 y no llama a nadie", async () => {
  const fetchImpl = fetchFalso(exito("x"));
  await assert.rejects(generarDescripcion({ producto, negocio, config: { ...config, clave: null }, fetchImpl }), { estado: 503 });
  assert.equal(fetchImpl.llamadas.length, 0);
});

test("si el modelo no puede con las fotos, reintenta solo con texto", async () => {
  const fetchImpl = fetchFalso({ status: 400, cuerpo: { error: { message: "image fetch failed" } } }, exito("Texto sin fotos."));
  const r = await generarDescripcion({ producto, negocio, config: { ...config, vision: true }, fetchImpl });
  assert.equal(r.usaFotos, false);
  assert.equal(fetchImpl.llamadas.length, 2);
  assert.equal(typeof fetchImpl.llamadas[1].messages[1].content, "string");
});

test("traduce los errores del proveedor a mensajes entendibles", async () => {
  const silenciar = console.error; console.error = () => {};
  try {
    await assert.rejects(generarDescripcion({ producto, negocio, config, fetchImpl: fetchFalso({ status: 429, cuerpo: {} }) }), { estado: 429 });
    await assert.rejects(generarDescripcion({ producto, negocio, config, fetchImpl: fetchFalso({ status: 500, cuerpo: {} }) }), { estado: 502 });
    await assert.rejects(generarDescripcion({ producto, negocio, config, fetchImpl: fetchFalso(exito("   ")) }), { estado: 502 });
    const tiempo = Object.assign(new Error("timeout"), { name: "TimeoutError" });
    await assert.rejects(generarDescripcion({ producto, negocio, config, fetchImpl: fetchFalso(tiempo) }), { estado: 504 });
  } finally {
    console.error = silenciar;
  }
});
