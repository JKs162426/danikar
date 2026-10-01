import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { requiereAdmin } from "../middleware/auth.js";
import { limitarPeticiones } from "../middleware/limitador.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer en memoria: no toca el disco, manda el buffer directo a Cloudinary.
const subir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const permitidos = /^image\/(jpeg|png|webp)$/;
    const extension = /\.(jpe?g|png|webp)$/i;
    if (permitidos.test(file.mimetype) && extension.test(file.originalname)) {
      return cb(null, true);
    }
    cb(new Error("Solo se permiten imágenes JPG, PNG o WebP."));
  },
});

// El mimetype y el nombre los manda el navegador y se pueden falsificar.
// Los primeros bytes del archivo no mienten.
function esImagenReal(buffer) {
  if (buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png =
    buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  const webp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}

function subirACloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "dankar", resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

const limiteSubidas = limitarPeticiones({
  maximo: 30,
  ventanaMs: 10 * 60 * 1000,
  mensaje: "Subiste muchas imágenes seguidas. Espera unos minutos.",
});

const router = Router();

router.post("/imagen", requiereAdmin, limiteSubidas, (req, res, next) => {
  subir.single("imagen")(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "La imagen no puede pesar más de 5 MB." });
    }
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ninguna imagen." });
    if (!esImagenReal(req.file.buffer)) {
      return res
        .status(400)
        .json({ error: "El archivo no es una imagen JPG, PNG o WebP válida." });
    }

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
