// En desarrollo el "proxy" del package.json reenvía al backend en 4000,
// así que la ruta relativa alcanza. En producción hará falta una URL
// absoluta, pero eso lo resolvemos al desplegar.
const BASE = "/api";

export class ErrorApi extends Error {
  constructor(mensaje, estado, detalles = null) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.detalles = detalles;
  }
}

export async function pedir(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      // Sin esto el navegador no manda ni recibe la cookie de sesión.
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...opciones,
    });
  } catch {
    // fetch solo rechaza si la red falló; un 500 se resuelve normal.
    throw new ErrorApi("No se pudo conectar con el servidor", 0);
  }

  if (respuesta.status === 204) return null;

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    // Respuesta sin JSON válido (un 502 del proxy, por ejemplo).
  }

  if (!respuesta.ok) {
    throw new ErrorApi(
      cuerpo?.error ?? `Error ${respuesta.status}`,
      respuesta.status,
      cuerpo?.detalles ?? null
    );
  }

  return cuerpo;
}
