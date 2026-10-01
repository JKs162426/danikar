import { pedir } from "./cliente";

export function obtenerContenidoPublico() {
  return pedir("/contenido");
}

export function obtenerContenidoAdmin() {
  return pedir("/admin/contenido");
}

export function guardarContenido(contenido) {
  return pedir("/admin/contenido", {
    method: "PUT",
    body: JSON.stringify(contenido),
  });
}

export async function subirImagen(archivo) {
  const form = new FormData();
  form.append("imagen", archivo);
  const { url } = await pedir("/archivos/imagen", { method: "POST", body: form });
  return url;
}
