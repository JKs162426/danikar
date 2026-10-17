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

// Una sola consulta por sesión del panel: si la IA no está configurada en
// el servidor, el botón ni aparece.
let estadoIa = null;
export function obtenerEstadoIa() {
  estadoIa ??= pedir("/admin/ia/estado").catch(() => {
    estadoIa = null;
    return { disponible: false };
  });
  return estadoIa;
}

export function generarDescripcion(producto) {
  return pedir("/admin/ia/descripcion", {
    method: "POST",
    body: JSON.stringify(producto),
  });
}
