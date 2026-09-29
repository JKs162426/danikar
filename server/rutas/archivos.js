import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { requiereAdmin } from "../middleware/auth.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer en memoria: no toca el disco, manda el buffer directo a Cloudinary.
const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = /jpeg|jpg|png|webp/;
    const esValido =
      permitidos.test(file.originalname.toLowerCase()) &&
      permitidos.test(file.mimetype);
    if (esValido) return cb(null, true);
    cb(new Error("Solo se permiten imágenes JPG, PNG o WebP."));
  },
});

function subirACloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "dankar" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

const router = Router();

router.post("/imagen", requiereAdmin, (req, res, next) => {
  subir.single("imagen")(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "La imagen no puede pesar más de 5 MB." });
    }
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ninguna imagen." });

    try {
      const resultado = await subirACloudinary(req.file.buffer);
      // secure_url es HTTPS, siempre.
      return res.json({ url: resultado.secure_url });
    } catch (error) {
      return next(error);
    }
  });
});

export default router;
