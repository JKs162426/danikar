import { Router } from "express";
import { leerContenido, guardarContenido } from "../datos/almacen.js";
import { contenidoSchema, formatearErrores } from "../config/esquema.js";
import {
  NOMBRE_COOKIE,
  credencialesValidas,
  emitirToken,
  opcionesCookie,
  requiereAdmin,
} from "../middleware/auth.js";
import {
  limitarLogin,
  registrarFallo,
  limpiarIntentos,
} from "../middleware/limitador.js";

const router = Router();

router.post("/login", limitarLogin, async (req, res, next) => {
  try {
    const { password } = req.body ?? {};

    if (!(await credencialesValidas(password))) {
      registrarFallo(req.ip);
      // Mensaje genérico a propósito: no le confirmamos nada a quien prueba.
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    limpiarIntentos(req.ip);
    res.cookie(NOMBRE_COOKIE, emitirToken(), opcionesCookie());
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie(), maxAge: undefined });
  res.json({ ok: true });
});

// A partir de acá, todo exige sesión.
router.use(requiereAdmin);

// Nada del panel debe quedar guardado en cachés del navegador o proxies.
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/sesion", (req, res) => {
  res.json({ autenticado: true });
});

// Sin filtrar: el admin necesita ver y editar también lo no disponible.
router.get("/contenido", (req, res) => {
  res.json(leerContenido());
});

// Reemplazo completo del documento. Para una sola editora es más simple
// y predecible que parchear campo por campo.
router.put("/contenido", async (req, res, next) => {
  const resultado = contenidoSchema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: "Contenido inválido",
      detalles: formatearErrores(resultado.error),
    });
  }

  try {
    return res.json(await guardarContenido(resultado.data));
  } catch (error) {
    return next(error);
  }
});

export default router;
