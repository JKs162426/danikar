import { useState, useEffect, useMemo, useCallback } from "react";
import { precioDeVariante } from "../utils/whatsapp";

const CLAVE = "dankar-carrito-v1";
export const MAX_CANTIDAD = 99;

// localStorage puede no existir o lanzar (modo privado, cookies bloqueadas).
// En ese caso el carrito funciona igual, solo que no sobrevive a recargar.
function leerGuardado() {
  try {
    const crudo = JSON.parse(window.localStorage.getItem(CLAVE) ?? "[]");
    if (!Array.isArray(crudo)) return [];
    // Lo guardado puede venir de una versión vieja o estar manipulado.
    return crudo
      .filter(
        (i) =>
          typeof i?.productoId === "string" &&
          typeof i.tamano === "string" &&
          typeof i.color === "string" &&
          typeof i.nota === "string" &&
          Number.isInteger(i.cantidad)
      )
      .map((i) => ({
        productoId: i.productoId,
        color: i.color,
        tamano: i.tamano,
        nota: i.nota.slice(0, 300),
        cantidad: Math.min(MAX_CANTIDAD, Math.max(1, i.cantidad)),
        clave: claveDe(i),
      }));
  } catch {
    return [];
  }
}

function escribirGuardado(items) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Sin almacenamiento disponible: no pasa nada.
  }
}

// Mismo producto con las mismas opciones = misma línea; se suman cantidades.
function claveDe({ productoId, color, tamano, nota }) {
  return [productoId, color, tamano, nota.trim()].join("|");
}

export function useCarrito(productos) {
  // Solo guardamos lo que eligió la clienta (id + opciones). Nombre y precio
  // se leen siempre del catálogo actual: si tu tía cambia un precio, el
  // carrito guardado no manda el precio viejo.
  const [items, setItems] = useState(leerGuardado);

  useEffect(() => escribirGuardado(items), [items]);

  const lineas = useMemo(() => {
    const porId = new Map(productos.map((p) => [p.id, p]));
    return items.flatMap((item) => {
      const producto = porId.get(item.productoId);
      const precio = producto && precioDeVariante(producto, item.tamano);
      // Producto oculto/eliminado o tamaño que ya no existe: se descarta.
      if (precio == null) return [];
      return [{ ...item, producto, precio }];
    });
  }, [items, productos]);

  // Limpia del almacenamiento lo que ya no está en el catálogo.
  useEffect(() => {
    if (lineas.length !== items.length) {
      setItems(lineas.map(({ producto, precio, ...item }) => item));
    }
  }, [lineas, items.length]);

  const agregar = useCallback(({ productoId, color, tamano, cantidad, nota }) => {
    const item = { productoId, color, tamano, nota: nota.trim() };
    const clave = claveDe(item);
    setItems((actuales) => {
      const existente = actuales.find((i) => i.clave === clave);
      if (existente) {
        return actuales.map((i) =>
          i.clave === clave
            ? { ...i, cantidad: Math.min(MAX_CANTIDAD, i.cantidad + cantidad) }
            : i
        );
      }
      return [...actuales, { ...item, clave, cantidad }];
    });
  }, []);

  const cambiarCantidad = useCallback((clave, cantidad) => {
    const limpia = Math.min(MAX_CANTIDAD, Math.max(1, cantidad));
    setItems((actuales) =>
      actuales.map((i) => (i.clave === clave ? { ...i, cantidad: limpia } : i))
    );
  }, []);

  const quitar = useCallback((clave) => {
    setItems((actuales) => actuales.filter((i) => i.clave !== clave));
  }, []);

  const vaciar = useCallback(() => setItems([]), []);

  const total = lineas.reduce((suma, l) => suma + l.precio * l.cantidad, 0);
  const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0);

  return { lineas, total, unidades, agregar, cambiarCantidad, quitar, vaciar };
}
