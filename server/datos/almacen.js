import { MongoClient } from "mongodb";
import { config } from "../config/config.js";
import { contenidoSchema } from "../config/esquema.js";
import { mkdir } from "node:fs/promises";
import path from "node:path";

// Un solo documento representa todo el contenido del sitio.
// Lo identificamos con este ID fijo.
const DOC_ID = "dankar-contenido";

let cliente = null;
let coleccion = null;
let cache = null;

export async function inicializarAlmacen() {
  // Asegura que la carpeta de imágenes exista en cualquier entorno.
  const carpetaImagenes = path.join(
    process.cwd(),
    "server",
    "publico",
    "imagenes"
  );
  await mkdir(carpetaImagenes, { recursive: true });

  cliente = new MongoClient(config.mongoUri);
  await cliente.connect();

  const db = cliente.db("dankar");
  coleccion = db.collection("contenido");

  // Buscamos el documento. Si no existe lo creamos con contenido inicial.
  const doc = await coleccion.findOne({ _id: DOC_ID });

  if (!doc) {
    console.log("[almacen] no existe documento, creando contenido inicial...");
    const inicial = contenidoSchema.parse({
      negocio: {
        nombre: "Detalles DanKar",
        descripcion: "Cintillos, lazos, pulseras y muchas cosas más.",
        telefonoWhatsapp: "584121234567",
        instagram: "detalles_dankar",
        ubicacion: "Pariaguán, Anzoátegui, Venezuela",
        saludoPedido: "Hola, quiero hacer un pedido:",
      },
      categorias: ["lazos", "cintillos", "pulseras"],
      productos: [],
    });

    await coleccion.insertOne({ _id: DOC_ID, ...inicial });
    cache = inicial;
  } else {
    // Quitamos el _id de Mongo antes de validar con Zod.
    const { _id, ...datos } = doc;
    cache = contenidoSchema.parse(datos);
  }

  console.log(
    `[almacen] conectado a MongoDB (${cache.productos.length} productos)`
  );
  return cache;
}

export function leerContenido() {
  if (cache === null) throw new Error("El almacén no fue inicializado.");
  return cache;
}

export async function guardarContenido(contenidoValidado) {
  const conMarca = {
    ...contenidoValidado,
    actualizadoEn: new Date().toISOString(),
  };

  await coleccion.replaceOne(
    { _id: DOC_ID },
    { _id: DOC_ID, ...conMarca },
    { upsert: true }
  );

  cache = conMarca;
  return cache;
}

export async function cerrarConexion() {
  await cliente?.close();
}
