import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { config } from "../config/config.js";

export const NOMBRE_COOKIE = "sesion_admin";

// Fijamos el algoritmo al firmar y al verificar: así nadie puede colar
// un token con "alg: none" u otro algoritmo que no esperamos.
const ALGORITMO = "HS256";

// Huella de la contraseña actual dentro del token: si se cambia
// ADMIN_PASSWORD_HASH, todas las sesiones abiertas dejan de valer. Es la
// forma de echar a alguien que haya conseguido entrar. Solo es un
// fragmento del SHA-256 del hash: no sirve para adivinar la contraseña.
const huellaPassword = createHash("sha256")
  .update(config.passwordHash)
  .digest("base64url")
  .slice(0, 16);

export async function credencialesValidas(password) {
  // bcrypt solo mira los primeros 72 bytes; algo más largo es ruido
  // (o alguien intentando cansar al servidor).
  if (typeof password !== "string" || password.length === 0) return false;
  if (password.length > 200) return false;
  // bcrypt.compare es de tiempo constante: no filtra información
  // por cuánto tarda en responder.
  return bcrypt.compare(password, config.passwordHash);
}

export function emitirToken() {
  return jwt.sign({ rol: "admin", v: huellaPassword }, config.jwtSecret, {
    algorithm: ALGORITMO,
    expiresIn: `${config.sesionHoras}h`,
  });
}

export function opcionesCookie() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: config.sesionHoras * 60 * 60 * 1000,
    path: "/",
  };
}

export function requiereAdmin(req, res, next) {
  const token = req.cookies?.[NOMBRE_COOKIE];
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [ALGORITMO],
    });
    if (payload.rol !== "admin") {
      return res.status(403).json({ error: "Sin permisos" });
    }
    if (payload.v !== huellaPassword) throw new Error("contraseña cambiada");
    return next();
  } catch {
    // Token vencido o firma inválida: limpiamos la cookie para que el
    // frontend no quede creyendo que hay sesión.
    res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie(), maxAge: undefined });
    return res.status(401).json({ error: "Sesión inválida o vencida" });
  }
}
