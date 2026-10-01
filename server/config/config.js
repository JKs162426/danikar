import "dotenv/config";
import path from "node:path";

function requerido(nombre) {
  const valor = process.env[nombre];
  if (!valor || valor.trim() === "") {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el .env`);
  }
  return valor;
}

// Un secreto corto se puede adivinar por fuerza bruta y con él se
// fabrican sesiones de admin. Generar uno: openssl rand -hex 32
function secretoJwt() {
  const secreto = requerido("JWT_SECRET");
  if (secreto.length < 32) {
    console.warn("[config] JWT_SECRET es muy corto: usa al menos 32 caracteres.");
  }
  return secreto;
}

export const config = {
  puerto: Number(process.env.SERVER_PORT ?? 4000),
  entorno: process.env.NODE_ENV ?? "development",

  // En Render con disco persistente: RUTA_DATOS=/var/data/contenido.json
  rutaDatos: path.resolve(
    process.env.RUTA_DATOS ??
      path.join(process.cwd(), "server", "datos", "contenido.json")
  ),

  jwtSecret: secretoJwt(),
  sesionHoras: Number(process.env.SESION_HORAS ?? 12),

  passwordHash: requerido("ADMIN_PASSWORD_HASH"),

  mongoUri: requerido("MONGODB_URI"),
};

export const esProduccion = config.entorno === "production";
