import { readFile, rename, mkdir, unlink, open } from "node:fs/promises";
import path from "node:path";
import { config } from "../config/config.js";
import { contenidoSchema } from "../config/esquema.js";

let cache = null;
let cola = Promise.resolve();

// Encola cada operación para que nunca haya dos escrituras a la vez.
// El segundo argumento de .then() mantiene la cola viva aunque una falle.
function enCola(operacion) {
  const resultado = cola.then(operacion, operacion);
  cola = resultado.catch(() => {});
  return resultado;
}

async function escribirAtomico(datos) {
  const json = JSON.stringify(datos, null, 2);
  const tmp = `${config.rutaDatos}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(path.dirname(config.rutaDatos), { recursive: true });

  let manejador;
  try {
    manejador = await open(tmp, "w");
    await manejador.writeFile(json, "utf8");
    // Sin este sync, un corte de energía puede dejarte el archivo
    // renombrado pero vacío.
    await manejador.sync();
  } finally {
    await manejador?.close();
  }

  try {
    await rename(tmp, config.rutaDatos);
  } catch (error) {
    await unlink(tmp).catch(() => {});
    throw error;
  }
}

export async function inicializarAlmacen() {
  const crudo = await readFile(config.rutaDatos, "utf8");
  cache = contenidoSchema.parse(JSON.parse(crudo));
  console.log(
    `[almacen] contenido cargado (${cache.productos.length} productos)`
  );
  return cache;
}

export function leerContenido() {
  if (cache === null) {
    throw new Error("El almacén no fue inicializado.");
  }
  return cache;
}

// El contenido ya debe venir validado. La cache solo se actualiza si el
// disco respondió bien: así memoria y archivo nunca divergen.
export function guardarContenido(contenidoValidado) {
  return enCola(async () => {
    const conMarca = {
      ...contenidoValidado,
      actualizadoEn: new Date().toISOString(),
    };
    await escribirAtomico(conMarca);
    cache = conMarca;
    return cache;
  });
}
