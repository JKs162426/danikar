import { construirEnlace, construirMensaje } from "../utils/whatsapp";

const negocio = { saludoPedido: "Hola, quiero hacer un pedido:", telefonoWhatsapp: "584121234567" };
const lazo = { id: "lazo", nombre: "Lazo clásico", variantes: [{ tamano: "Mediano", precio: 5 }] };
const pulsera = { id: "pulsera", nombre: "Pulsera", variantes: [{ tamano: "Única", precio: 2.5 }] };

test("arma un mensaje con varias líneas y el total", () => {
  const mensaje = construirMensaje({
    negocio,
    lineas: [
      { producto: lazo, color: "Rojo", tamano: "Mediano", cantidad: 2, nota: " Con nombre ", precio: 5 },
      { producto: pulsera, color: "", tamano: "Única", cantidad: 1, nota: "", precio: 2.5 },
    ],
  });

  expect(mensaje).toContain("1. Lazo clásico");
  expect(mensaje).toContain("Color: Rojo · Tamaño: Mediano");
  expect(mensaje).toContain("Cantidad: 2 × $5.00 = $10.00");
  expect(mensaje).toContain("Nota: Con nombre");
  expect(mensaje).toContain("2. Pulsera");
  expect(mensaje).toMatch(/Total: \$12\.50$/);
});

test("el enlace codifica saltos de línea y acentos", () => {
  const enlace = construirEnlace({
    negocio,
    lineas: [{ producto: lazo, color: "", tamano: "Mediano", cantidad: 1, nota: "", precio: 5 }],
  });
  expect(enlace.startsWith("https://wa.me/584121234567?text=")).toBe(true);
  expect(enlace).not.toMatch(/\n| /);
  expect(decodeURIComponent(enlace.split("text=")[1])).toContain("Lazo clásico");
});
