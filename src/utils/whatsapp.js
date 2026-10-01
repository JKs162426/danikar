export function formatearPrecio(valor) {
  return `$${valor.toFixed(2)}`;
}

export function precioDeVariante(producto, tamano) {
  const variante = producto.variantes.find((v) => v.tamano === tamano);
  return variante ? variante.precio : null;
}

export function precioMinimo(producto) {
  return Math.min(...producto.variantes.map((v) => v.precio));
}

// Cada línea: { producto, color, tamano, cantidad, nota, precio }.
// Un pedido de un solo producto es simplemente una lista de una línea.
export function construirMensaje({ negocio, lineas }) {
  const texto = [negocio.saludoPedido, ""];
  let total = 0;

  lineas.forEach((linea, i) => {
    const { producto, color, tamano, cantidad, nota, precio } = linea;
    const opciones = [color && `Color: ${color}`, tamano && `Tamaño: ${tamano}`]
      .filter(Boolean)
      .join(" · ");

    texto.push(`${i + 1}. ${producto.nombre}`);
    if (opciones) texto.push(`   ${opciones}`);
    texto.push(
      `   Cantidad: ${cantidad} × ${formatearPrecio(precio)} = ${formatearPrecio(
        precio * cantidad
      )}`
    );
    if (nota?.trim()) texto.push(`   Nota: ${nota.trim()}`);
    texto.push("");
    total += precio * cantidad;
  });

  texto.push(`Total: ${formatearPrecio(total)}`);
  return texto.join("\n");
}

export function enlaceWhatsapp(telefono, mensaje = "") {
  if (!telefono) return null;
  // encodeURIComponent es obligatorio: sin él, los saltos de línea y
  // los acentos rompen la URL y el mensaje llega mutilado o vacío.
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : "";
  return `https://wa.me/${telefono}${texto}`;
}

export function construirEnlace({ negocio, lineas }) {
  return enlaceWhatsapp(
    negocio?.telefonoWhatsapp,
    construirMensaje({ negocio, lineas })
  );
}
