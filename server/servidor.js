import express from "express";
import cookieParser from "cookie-parser";
import { inicializarAlmacen, cerrarConexion } from "./datos/almacen.js";

import cors from "cors";
import { config, esProduccion } from "./config/config.js";
import publicas from "./rutas/publicas.js";
import admin from "./rutas/admin.js";
import archivos from "./rutas/archivos.js";

const app = express();

// No anunciamos que esto corre en Express.
app.disable("x-powered-by");

// Render y Fly ponen un proxy delante. Sin esto req.ip es la IP del
// proxy y el limitador bloquearía a todo el mundo junto.
app.set("trust proxy", 1);
const origenesPermitidos = process.env.ORIGENES_PERMITIDOS
  ? process.env.ORIGENES_PERMITIDOS.split(",").map((o) => o.trim())
  : ["https://dankar.vercel.app"];

app.use(
  cors({
    origin: origenesPermitidos,
    credentials: true,
  })
);

// Cabeceras de seguridad. El backend solo sirve JSON, así que la CSP
// puede ser la más estricta posible: no carga nada ni se deja enmarcar.
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'"
  );
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  if (esProduccion) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  next();
});

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

app.use("/api/archivos", archivos);

app.get("/api/salud", (req, res) => res.json({ ok: true }));
app.use("/api", publicas);
app.use("/api/admin", admin);

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.use((error, req, res, next) => {
  // JSON mal formado: es culpa del cliente, no un 500.
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: "El contenido es demasiado grande" });
  }
  console.error("[error]", error);
  return res.status(500).json({
    error: "Error interno",
    // En producción no le regalamos stack traces a nadie.
    ...(esProduccion ? {} : { detalle: error.message }),
  });
});

process.on("SIGTERM", async () => {
  await cerrarConexion();
  process.exit(0);
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
