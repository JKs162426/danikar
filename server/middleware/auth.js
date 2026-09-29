import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config, esProduccion, cookieCrossSite } from "../config/config.js";

export const NOMBRE_COOKIE = "sesion_admin";

export async function credencialesValidas(password) {
  if (typeof password !== "string" || password.length === 0) return false;
  // bcrypt.compare es de tiempo constante: no filtra información
  // por cuánto tarda en responder.
  return bcrypt.compare(password, config.passwordHash);
}

export function emitirToken() {
  return jwt.sign({ rol: "admin" }, config.jwtSecret, {
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
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.rol !== "admin") {
      return res.status(403).json({ error: "Sin permisos" });
    }
    return next();
  } catch {
    // Token vencido o firma inválida: limpiamos la cookie para que el
    // frontend no quede creyendo que hay sesión.
    res.clearCookie(NOMBRE_COOKIE, { ...opcionesCookie(), maxAge: undefined });
    return res.status(401).json({ error: "Sesión inválida o vencida" });
  }
}
