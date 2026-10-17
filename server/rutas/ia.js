import { Router } from "express";
import { leerContenido } from "../datos/almacen.js";
import { formatearErrores } from "../config/esquema.js";
import { limitarPeticiones } from "../middleware/limitador.js";
import {
  ErrorIa,
  configuracionIa,
  generarDescripcion,
  pedidoSchema,
} from "../ia/descripcion.js";

// Se monta detrás de requiereAdmin (ver admin.js): solo el panel la usa.
const router = Router();

// Cada llamada cuesta (dinero o cuota gratuita del proveedor).
const limiteIa = limitarPeticiones({
  maximo: 20,
  ventanaMs: 10 * 60 * 1000,
  mensaje: "Pediste muchas descripciones seguidas. Espera unos minutos.",
});

// El panel lo consulta para mostrar u ocultar el botón.
router.get("/estado", (req, res) => {
  const { clave, modelo, vision } = configuracionIa();
  res.json({ disponible: Boolean(clave), modelo, vision });
});

router.post("/descripcion", limiteIa, async (req, res, next) => {
  const pedido = pedidoSchema.safeParse(req.body);
  if (!pedido.success) {
    return res.status(400).json({
      error: "Faltan datos del producto",
      detalles: formatearErrores(pedido.error),
    });
  }

  try {
    const resultado = await generarDescripcion({
      producto: pedido.data,
      negocio: leerContenido().negocio,
    });
    return res.json(resultado);
  } catch (error) {
    if (error instanceof ErrorIa) {
      return res.status(error.estado).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
