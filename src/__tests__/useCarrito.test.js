import { renderHook, act } from "@testing-library/react";
import { useCarrito } from "../hooks/useCarrito";

const productos = [
  { id: "lazo", nombre: "Lazo", imagenes: [], variantes: [{ tamano: "P", precio: 3 }, { tamano: "M", precio: 5 }] },
];
const eleccion = { productoId: "lazo", color: "Rojo", tamano: "M", cantidad: 1, nota: "" };

beforeEach(() => window.localStorage.clear());

test("suma cantidades de la misma elección y calcula el total", () => {
  const { result } = renderHook(() => useCarrito(productos));
  act(() => result.current.agregar(eleccion));
  act(() => result.current.agregar({ ...eleccion, cantidad: 2 }));
  act(() => result.current.agregar({ ...eleccion, tamano: "P" }));

  expect(result.current.lineas).toHaveLength(2);
  expect(result.current.unidades).toBe(4);
  expect(result.current.total).toBe(3 * 5 + 3);
});

test("persiste en localStorage y usa el precio actual del catálogo", () => {
  const { result, unmount } = renderHook(() => useCarrito(productos));
  act(() => result.current.agregar(eleccion));
  unmount();

  const nuevoPrecio = [{ ...productos[0], variantes: [{ tamano: "M", precio: 7 }] }];
  const { result: otra } = renderHook(() => useCarrito(nuevoPrecio));
  expect(otra.current.total).toBe(7);
});

test("descarta productos que ya no existen y datos guardados corruptos", () => {
  window.localStorage.setItem(
    "dankar-carrito-v1",
    JSON.stringify([{ productoId: "borrado", color: "", tamano: "M", nota: "", cantidad: 1 }, { basura: true }, "x"])
  );
  const { result } = renderHook(() => useCarrito(productos));
  expect(result.current.lineas).toHaveLength(0);
  expect(JSON.parse(window.localStorage.getItem("dankar-carrito-v1"))).toEqual([]);
});

test("la cantidad queda entre 1 y 99", () => {
  const { result } = renderHook(() => useCarrito(productos));
  act(() => result.current.agregar(eleccion));
  const clave = result.current.lineas[0].clave;
  act(() => result.current.cambiarCantidad(clave, 500));
  expect(result.current.unidades).toBe(99);
  act(() => result.current.cambiarCantidad(clave, 0));
  expect(result.current.unidades).toBe(1);
});
