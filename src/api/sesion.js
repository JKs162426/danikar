import { pedir, ErrorApi } from "./cliente";

export function iniciarSesion(password) {
  return pedir("/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function cerrarSesion() {
  return pedir("/admin/logout", { method: "POST" });
}

// Devuelve true/false en vez de lanzar: "no hay sesión" es un estado
// normal de la aplicación, no un error que haya que atrapar en cada uso.
export async function verificarSesion() {
  try {
    await pedir("/admin/sesion");
    return true;
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 401) return false;
    throw error;
  }
}
