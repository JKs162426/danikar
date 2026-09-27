import { Router } from "express";
import { leerContenido } from "../datos/almacen.js";

const router = Router();

// Lo que consume el sitio que ven las clientas.
router.get("/contenido", (req, res) => {
  const contenido = leerContenido();

  // Filtramos acá para que el frontend público no tenga que saber
  // nada de productos ocultos.
  res.json({
    negocio: contenido.negocio,
    categorias: contenido.categorias,
    productos: contenido.productos.filter((p) => p.disponible),
    actualizadoEn: contenido.actualizadoEn,
  });
});

export default router;
