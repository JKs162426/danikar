import express from "express";
import cookieParser from "cookie-parser";

import { config, esProduccion } from "./config/config.js";
import { inicializarAlmacen } from "./datos/almacen.js";
import publicas from "./rutas/publicas.js";
import admin from "./rutas/admin.js";
import { join } from "node:path";
import archivos from "./rutas/archivos.js";

const app = express();

// Render y Fly ponen un proxy delante. Sin esto req.ip es la IP del
// proxy y el limitador bloquearía a todo el mundo junto.
app.set("trust proxy", 1);

app.use((req, res, next) => {
  // Si las cabeceras pesan más de 8 KB, casi siempre son cookies basura.
  const tamano = JSON.stringify(req.headers).length;
  if (tamano > 8192) {
    res.setHeader("Clear-Site-Data", '"cookies"');
    return res
      .status(400)
      .json({ error: "Demasiadas cookies. Recarga la página." });
  }
  return next();
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

import { createRequire } from "node:module";

app.use(
  "/imagenes",
  express.static(join(process.cwd(), "server", "publico", "imagenes"))
);
app.use("/api/archivos", archivos);

app.get("/api/salud", (req, res) => res.json({ ok: true }));
app.use("/api", publicas);
app.use("/api/admin", admin);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.use((error, req, res, next) => {
  console.error("[error]", error);
  res.status(500).json({
    error: "Error interno",
    // En producción no le regalamos stack traces a nadie.
    ...(esProduccion ? {} : { detalle: error.message }),
  });
});

try {
  await inicializarAlmacen();
  app.listen(config.puerto, () => {
    console.log(`[servidor] http://localhost:${config.puerto}`);
  });
} catch (error) {
  console.error("[fatal] no arrancó:", error.message);
  process.exit(1);
}
