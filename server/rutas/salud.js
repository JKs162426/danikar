import { Router } from "express";
import { leerContenido, baseDatosResponde } from "../datos/almacen.js";

// Render llama a esta ruta (healthCheckPath en render.yaml) para saber si
// el servicio está vivo: durante un deploy no cambia a la versión nueva
// hasta que responda 200, y si deja de responder, reinicia la instancia.
const router = Router();

router.get("/", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  try {
    // Si el catálogo no está en memoria, la tienda no puede atender a nadie.
    leerContenido();
  } catch {
    return res.status(503).json({ ok: false, baseDatos: "sin iniciar" });
  }

  // 200 aunque MongoDB no responda: el catálogo se sirve desde memoria y la
  // tienda sigue vendiendo; solo fallaría guardar desde el panel. Con un
  // 503 Render dejaría de mandarle tráfico y la tumbaría por completo.
  const baseDatos = (await baseDatosResponde()) ? "ok" : "sin respuesta";
  return res.json({ ok: true, baseDatos });
});

export default router;
