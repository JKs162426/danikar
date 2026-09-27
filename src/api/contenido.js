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

  const respuesta = await fetch("/api/archivos/imagen", {
    method: "POST",
    credentials: "include",
    body: form,
    // Sin Content-Type: el navegador lo pone solo con el boundary correcto.
  });

  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(cuerpo.error ?? "Error al subir imagen");
  return cuerpo.url;
}
