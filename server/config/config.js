import "dotenv/config";
import path from "node:path";

function requerido(nombre) {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === "") {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el .env`);
  }
  return valor;
}

export const config = {
  puerto: Number(process.env.SERVER_PORT ?? 4000),
  entorno: process.env.NODE_ENV ?? "development",

  // En Render con disco persistente: RUTA_DATOS=/var/data/contenido.json
  rutaDatos: path.resolve(
    process.env.RUTA_DATOS ??
      path.join(process.cwd(), "server", "datos", "contenido.json")
  ),

  jwtSecret: requerido("JWT_SECRET"),
  sesionHoras: Number(process.env.SESION_HORAS ?? 12),

  passwordHash: requerido("ADMIN_PASSWORD_HASH"),

  mongoUri: requerido("MONGODB_URI"),
};

export const esProduccion = config.entorno === "production";
// true cuando frontend y backend viven en dominios distintos (Vercel + Render).
export const cookieCrossSite = process.env.COOKIE_CROSS_SITE === "true";
