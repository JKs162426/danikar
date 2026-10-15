import { construirMensaje, formatearBs } from "../utils/whatsapp";
import { interpretarTasa } from "../componentes/admin/CampoTasa";

const lazo = { id: "lazo", nombre: "Lazo", variantes: [{ tamano: "M", precio: 5 }] };
const linea = { producto: lazo, color: "", tamano: "M", cantidad: 2, nota: "", precio: 5 };
const base = { saludoPedido: "Hola:", telefonoWhatsapp: "584121234567" };

test("formatea en bolívares con punto de miles y coma decimal", () => {
  expect(formatearBs(5, 36.5)).toBe("Bs 182,50");
  expect(formatearBs(40, 36.5)).toBe("Bs 1.460,00");
  expect(formatearBs(5, null)).toBeNull();
});

test("el mensaje incluye el total en Bs y la tasa usada", () => {
  const mensaje = construirMensaje({
    negocio: { ...base, tasaBs: 36.5, tasaActualizadaEn: "2026-10-15T15:00:00.000Z" },
    lineas: [linea],
  });
  expect(mensaje).toContain("Total: $10.00");
  expect(mensaje).toContain("Total en bolívares: Bs 365,00");
  expect(mensaje).toContain("(tasa Bs 36,50 por $ del 15/10/2026)");
});

test("sin tasa, el mensaje queda solo en dólares", () => {
  const mensaje = construirMensaje({ negocio: { ...base, tasaBs: null }, lineas: [linea] });
  expect(mensaje).not.toMatch(/Bs|bolívares/);
});

test("interpreta la tasa escrita con coma, punto o miles", () => {
  expect(interpretarTasa("36,50")).toBe(36.5);
  expect(interpretarTasa(" 36.5 ")).toBe(36.5);
  expect(interpretarTasa("1.234,50")).toBe(1234.5);
  expect(interpretarTasa("")).toBeNull();
  expect(interpretarTasa("36,")).toBeNaN();
  expect(interpretarTasa("abc")).toBeNaN();
  expect(interpretarTasa("0")).toBeNaN();
});
