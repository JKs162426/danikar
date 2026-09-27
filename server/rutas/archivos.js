import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requiereAdmin } from "../middleware/auth.js";

// En producción (Render) esta carpeta debe estar dentro del disco
// persistente. Puedes controlarlo con la variable RUTA_PUBLICO.
const CARPETA = process.env.RUTA_PUBLICO
  ? path.join(process.env.RUTA_PUBLICO, "imagenes")
  : path.join(process.cwd(), "server", "publico", "imagenes");

const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CARPETA),
  filename: (req, file, cb) => {
    // Nombre aleatorio para evitar colisiones y no exponer el nombre original.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, randomBytes(12).toString("hex") + ext);
  },
});

const subir = multer({
  storage: almacenamiento,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (req, file, cb) => {
    const permitidos = /jpeg|jpg|png|webp/;
    const esValido =
      permitidos.test(path.extname(file.originalname).toLowerCase()) &&
      permitidos.test(file.mimetype);

    if (esValido) return cb(null, true);
    cb(new Error("Solo se permiten imágenes JPG, PNG o WebP."));
  },
});

const router = Router();

// Solo el admin puede subir imágenes.
router.post("/imagen", requiereAdmin, (req, res, next) => {
  subir.single("imagen")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "La imagen no puede pesar más de 5 MB." });
    }
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ninguna imagen." });

    // Devolvemos la URL pública que el frontend guarda en el producto.
    return res.json({ url: `/imagenes/${req.file.filename}` });
  });
});

export default router;
