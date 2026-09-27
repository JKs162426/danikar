export function formatearPrecio(valor) {
  return `$${valor.toFixed(2)}`;
}

export function precioDeVariante(producto, tamano) {
  const variante = producto.variantes.find((v) => v.tamano === tamano);
  return variante ? variante.precio : null;
}

export function construirMensaje({
  negocio,
  producto,
  color,
  tamano,
  cantidad = 1,
  nota = "",
}) {
  const precio = precioDeVariante(producto, tamano);
  const lineas = [negocio.saludoPedido, ""];

  lineas.push(`Producto: ${producto.nombre}`);
  if (color) lineas.push(`Color: ${color}`);
  if (tamano) lineas.push(`Tamaño: ${tamano}`);
  lineas.push(`Cantidad: ${cantidad}`);

  if (precio !== null) {
    lineas.push(`Precio unitario: ${formatearPrecio(precio)}`);
    lineas.push(`Total: ${formatearPrecio(precio * cantidad)}`);
  }

  if (nota.trim()) {
    lineas.push("", `Nota: ${nota.trim()}`);
  }

  return lineas.join("\n");
}

export function construirEnlace({ negocio, ...resto }) {
  if (!negocio?.telefonoWhatsapp) return null;

  const mensaje = construirMensaje({ negocio, ...resto });
  // encodeURIComponent es obligatorio: sin él, los saltos de línea y
  // los acentos rompen la URL y el mensaje llega mutilado o vacío.
  return `https://wa.me/${negocio.telefonoWhatsapp}?text=${encodeURIComponent(
    mensaje
  )}`;
}
