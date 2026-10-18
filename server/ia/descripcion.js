import { z } from "zod";
import { TIPOS_AGARRE } from "../config/esquema.js";

// Escribe la descripción de un producto mirando sus fotos, con un modelo
// multimodal servido por Groq (por defecto Qwen 3.8 27B). La API de Groq es
// compatible con la de OpenAI, así que cambiar de modelo o de proveedor es
// cambiar IA_MODELO e IA_URL. Con un modelo que solo lee texto, IA_VISION=false.

export const MAX_DESCRIPCION = 1000;
const TIEMPO_MAXIMO_MS = 20 * 1000;

export function configuracionIa(entorno = process.env) {
  return {
    clave: (entorno.IA_API_KEY ?? entorno.GROQ_API_KEY)?.trim() || null,
    url: entorno.IA_URL ?? "https://api.groq.com/openai/v1/chat/completions",
    modelo: entorno.IA_MODELO ?? "qwen/qwen3.8-27b",
    vision: entorno.IA_VISION !== "false",
    // Cada foto cuesta unos 1.800 tokens (medido: igual a 512 que a 768 px)
    // y el plan gratuito de Groq da 7.000 por minuto. Con 1 foto entran unos
    // 3 pedidos por minuto, así "Otra versión" no choca con el límite.
    maxFotos: Math.max(0, Math.min(5, Number(entorno.IA_MAX_FOTOS ?? 1) || 0)),
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
  // Lo que la dueña ya había escrito (muchas veces, las medidas). La IA lo
  // tiene que conservar, no reemplazar.
  notas: z.string().trim().max(1000).default(""),
});

export class ErrorIa extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado;
  }
}

// Solo fotos de Cloudinary (las que sube el panel), a 768 px: más grande no
// aporta, y a 512 px el modelo confundió capibaras con hámsters.
export function imagenParaIa(url) {
  if (!/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) {
    return null;
  }
  return url.replace(
    "/image/upload/",
    "/image/upload/w_768,h_768,c_limit,q_auto,f_jpg/"
  );
}

export function construirMensajes(producto, negocio, { conFotos, maxFotos = 2 }) {
  const sistema = [
    `Escribes las descripciones de los productos de ${negocio.nombre}, una tienda familiar de accesorios artesanales${negocio.ubicacion ? ` en ${negocio.ubicacion}` : ""}.`,
    "Escribes en español de Venezuela, con un tono cálido y cercano, sin exagerar.",
    "Reglas:",
    "- Entre 2 y 3 oraciones, máximo 350 caracteres.",
    "- Usa solo los datos que te dan" +
      (conFotos ? " y lo que se ve en las fotos" : "") +
      ". No inventes materiales, medidas ni técnicas.",
    "- Si hay notas de la dueña, respétalas: incluye sus medidas tal cual y no las contradigas.",
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
    producto.notas && `Notas de la dueña:\n${producto.notas}`,
  ]
    .filter(Boolean)
    .join("\n");

  const fotos = conFotos
    ? producto.imagenes.map(imagenParaIa).filter(Boolean).slice(0, maxFotos)
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
  // Algunos modelos (Qwen, entre otros) anteponen su razonamiento.
  const sinRazonamiento = (texto ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "");
  let limpio = sinComillas(
    sinComillas(sinRazonamiento.replace(/\s+/g, " ")).replace(
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
    const espera = Number(respuesta.headers?.get?.("retry-after"));
    return { ok: false, estado: respuesta.status, cuerpo, espera };
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
    maxFotos: config.maxFotos,
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
      const segundos = Math.ceil(resultado.espera);
      throw new ErrorIa(
        segundos > 0 && segundos < 600
          ? `La IA está ocupada. Intenta en ${segundos} segundos.`
          : "La IA está ocupada. Intenta en un minuto.",
        429
      );
    }
    throw new ErrorIa("La IA no respondió bien. Intenta de nuevo.", 502);
  }

  const descripcion = limpiarRespuesta(resultado.texto);
  if (!descripcion) {
    throw new ErrorIa("La IA devolvió una respuesta vacía. Intenta de nuevo.", 502);
  }
  return { descripcion, modelo: config.modelo, usaFotos };
}
