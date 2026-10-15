export function formatearPrecio(valor) {
  return `$${valor.toFixed(2)}`;
}

// Formato venezolano: punto de miles y coma decimal (Bs 1.234,50).
const formatoBs = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// null si no hay tasa: así cada componente decide no mostrar nada.
export function formatearBs(dolares, tasa) {
  if (!tasa) return null;
  return `Bs ${formatoBs.format(dolares * tasa)}`;
}

export function formatearFechaTasa(iso, opciones = { day: "numeric", month: "long" }) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("es-VE", opciones).format(new Date(iso));
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

  const { tasaBs, tasaActualizadaEn } = negocio;
  if (tasaBs) {
    // La tasa va en el mensaje para que la tienda sepa con qué cifra
    // vio el pedido la clienta, aunque la tasa cambie después.
    const fecha = formatearFechaTasa(tasaActualizadaEn, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    texto.push(
      `Total en bolívares: ${formatearBs(total, tasaBs)}`,
      `(tasa ${formatearBs(1, tasaBs)} por $${fecha ? ` del ${fecha}` : ""})`
    );
  }
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
