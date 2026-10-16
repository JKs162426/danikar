import { origenesPermitidos } from "../config/config.js";

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defensa extra contra CSRF, además de la cookie SameSite=strict: toda
// petición que cambia algo y viene de un navegador trae Origin, y tiene
// que ser la tienda. Sin Origin no es un navegador (curl, un script), y
// esos no pueden usar la cookie de nadie, así que pasan a la autenticación.
export function verificarOrigen(req, res, next) {
  if (METODOS_SEGUROS.has(req.method)) return next();
  const origen = req.get("origin");
  if (origen && !origenesPermitidos.includes(origen)) {
    return res.status(403).json({ error: "Origen no permitido" });
  }
  return next();
}
