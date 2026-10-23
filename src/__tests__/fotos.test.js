import { fotoAjustada, juegoDeFotos } from "../utils/fotos";

const original =
  "https://res.cloudinary.com/demo/image/upload/v1790688581/dankar/lazo.jpg";

test("limita el ancho y pide formato y calidad automáticos", () => {
  expect(fotoAjustada(original, { ancho: 600 })).toBe(
    "https://res.cloudinary.com/demo/image/upload/c_limit,w_600,f_auto,q_auto/v1790688581/dankar/lazo.jpg"
  );
});

test("con alto recorta un cuadro para las miniaturas", () => {
  expect(fotoAjustada(original, { ancho: 132, alto: 132 })).toContain(
    "/image/upload/c_fill,w_132,h_132,f_auto,q_auto/v1790688581/"
  );
});

test("deja intactas las fotos que no son de Cloudinary", () => {
  expect(fotoAjustada("/imagenes/lazo.jpg", { ancho: 600 })).toBe(
    "/imagenes/lazo.jpg"
  );
  expect(fotoAjustada("https://otro.com/image/upload/x.jpg", { ancho: 600 })).toBe(
    "https://otro.com/image/upload/x.jpg"
  );
  expect(fotoAjustada(undefined, { ancho: 600 })).toBeUndefined();
  expect(juegoDeFotos("/imagenes/lazo.jpg")).toBeUndefined();
});

test("el srcset ofrece tres anchos", () => {
  const juego = juegoDeFotos(original).split(", ");
  expect(juego).toHaveLength(3);
  expect(juego[0]).toMatch(/\/c_limit,w_400,f_auto,q_auto\/.* 400w$/);
  expect(juego[2]).toMatch(/ 800w$/);
});
