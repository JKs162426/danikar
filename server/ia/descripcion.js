import { z } from "zod";
import { TIPOS_AGARRE } from "../config/esquema.js";

// Escribe la descripción de un producto con un modelo de Meta servido por
// Groq. La API de Groq es compatible con la de OpenAI, así que cambiar de
// proveedor (por ejemplo, a la Llama API de Meta) es cambiar IA_URL.
//
// Llama 3.3 70B solo lee texto. Si el modelo configurado ve imágenes
// (IA_VISION=true, por ejemplo meta-models/muse-spark-open), también se le
// mandan las fotos del producto.

export const MAX_DESCRIPCION = 1000;
const MAX_IMAGENES = 3;
const TIEMPO_MAXIMO_MS = 20 * 1000;

export function configuracionIa(entorno = process.env) {
  return {
    clave: entorno.GROQ_API_KEY?.trim() || null,
    url: entorno.IA_URL ?? "https://api.groq.com/openai/v1/chat/completions",
    modelo: entorno.IA_MODELO ?? "llama-3.3-70b-versatile",
    vision: entorno.IA_VISION === "true",
  };
}

// Lo que el panel manda: solo lo que sirve para describir. Sin precios a
// propósito: cambian seguido y una descripción no debería quedar vieja.
export const pedidoSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  categoria: z.string().trim().max(60).default(""),
  colores: z.array(z.string().trim().min(1).max(40)).max(40).default([]),
  variantes: z
    .array(z.object({ tamano: z.string().trim().min(1).max(40) }))
    .max(12)
    .default([]),
  tipoAgarre: z.enum(TIPOS_AGARRE).nullable().default(null),
  personalizable: z.boolean().default(false),
  imagenes: z.array(z.string().trim().max(500)).max(8).default([]),
});

export class ErrorIa extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

// Solo fotos de Cloudinary (las que sube el panel), achicadas: el modelo no
// necesita 4000 px para ver un lazo y cada píxel cuesta tokens.
export function imagenParaIa(url) {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) {
    return null;
  }
  return url.replace(
    "/image/upload/",
    "/image/upload/w_768,h_768,c_limit,q_auto,f_jpg/"
  );
}

export function construirMensajes(producto, negocio, { conFotos }) {
  const sistema = [
    `Escribes las descripciones de los productos de ${negocio.nombre}, una tienda familiar de accesorios artesanales${negocio.ubicacion ? ` en ${negocio.ubicacion}` : ""}.`,
    "Escribes en español de Venezuela, con un tono cálido y cercano, sin exagerar.",
    "Reglas:",
    "- Entre 2 y 3 oraciones, máximo 350 caracteres.",
    "- Usa solo los datos que te dan" +
      (conFotos ? " y lo que se ve en las fotos" : "") +
      ". No inventes materiales, medidas ni técnicas.",
    "- No menciones precios, descuentos ni promociones.",
    "- Si el producto es personalizable, invita a pedirlo con sus colores o un nombre.",
    "- Sin emojis, sin comillas, sin títulos ni listas: responde solo con el texto de la descripción.",
  ].join("\n");

  const datos = [
    "Escribe la descripción de este producto.",
    `Nombre: ${producto.nombre}`,
    producto.categoria && `Categoría: ${producto.categoria}`,
    producto.colores.length > 0 &&
      `Colores disponibles: ${producto.colores.join(", ")}`,
    producto.variantes.length > 0 &&
      `Tamaños: ${producto.variantes.map((v) => v.tamano).join(", ")}`,
    producto.tipoAgarre && `Tipo de agarre: ${producto.tipoAgarre}`,
    `Personalizable: ${producto.personalizable ? "sí" : "no"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const fotos = conFotos
    ? producto.imagenes.map(imagenParaIa).filter(Boolean).slice(0, MAX_IMAGENES)
    : [];

  const contenido =
    fotos.length > 0
      ? [
          { type: "text", text: `${datos}\n\nTe adjunto fotos del producto.` },
          ...fotos.map((url) => ({ type: "image_url", image_url: { url } })),
        ]
      : datos;

  return {
    mensajes: [
      { role: "system", content: sistema },
      { role: "user", content: contenido },
    ],
    usaFotos: fotos.length > 0,
  };
}

// Los modelos a veces envuelven el texto en comillas o le ponen un
// "Descripción:" delante aunque se les pida que no.
export function limpiarRespuesta(texto) {
  const sinComillas = (t) => t.trim().replace(/^["“”«»']+|["“”«»']+$/g, "").trim();
  let limpio = sinComillas(
    sinComillas((texto ?? "").replace(/\s+/g, " ")).replace(
      /^(descripci[oó]n|description)\s*:\s*/i,
      ""
    )
  );

  if (limpio.length > MAX_DESCRIPCION) {
    const corte = limpio.slice(0, MAX_DESCRIPCION);
    const finDeOracion = corte.lastIndexOf(". ");
    limpio = finDeOracion > 0 ? corte.slice(0, finDeOracion + 1) : corte;
  }
  return limpio;
}

async function llamarModelo(config, mensajes, fetchImpl) {
  let respuesta;
  try {
    respuesta = await fetchImpl(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.clave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.modelo,
        messages: mensajes,
        temperature: 0.7,
        max_completion_tokens: 300,
      }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new ErrorIa("La IA tardó demasiado. Intenta de nuevo.", 504);
    }
    throw new ErrorIa("No se pudo conectar con la IA.", 502);
  }

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    return { ok: false, estado: respuesta.status, cuerpo };
  }
  return { ok: true, texto: cuerpo?.choices?.[0]?.message?.content };
}

export async function generarDescripcion({
  producto,
  negocio,
  config = configuracionIa(),
  fetchImpl = fetch,
}) {
  if (!config.clave) {
    throw new ErrorIa("La IA no está configurada en el servidor.", 503);
  }

  let { mensajes, usaFotos } = construirMensajes(producto, negocio, {
    conFotos: config.vision,
  });
  let resultado = await llamarModelo(config, mensajes, fetchImpl);

  // Si el modelo no pudo con las fotos (formato, tamaño, URL caída), mejor
  // una descripción solo con los datos que ninguna.
  if (!resultado.ok && resultado.estado === 400 && usaFotos) {
    ({ mensajes, usaFotos } = construirMensajes(producto, negocio, {
      conFotos: false,
    }));
    resultado = await llamarModelo(config, mensajes, fetchImpl);
  }

  if (!resultado.ok) {
    // Al log va el detalle del proveedor (nunca la clave); a la pantalla,
    // un mensaje que se entienda.
    console.error(
      `[ia] ${config.modelo} respondió ${resultado.estado}:`,
      JSON.stringify(resultado.cuerpo?.error ?? resultado.cuerpo)?.slice(0, 300)
    );
    if (resultado.estado === 429) {
      throw new ErrorIa("La IA está ocupada. Intenta en un minuto.", 429);
    }
    throw new ErrorIa("La IA no respondió bien. Intenta de nuevo.", 502);
  }

  const descripcion = limpiarRespuesta(resultado.texto);
  if (!descripcion) {
    throw new ErrorIa("La IA devolvió una respuesta vacía. Intenta de nuevo.", 502);
  }
  return { descripcion, modelo: config.modelo, usaFotos };
}
