// Cloudinary achica las fotos al vuelo si se le pide en la URL. Sin esto,
// cada tarjeta bajaba la foto original (~125 KB) y cada miniatura de 44 px
// también. f_auto entrega WebP o AVIF según el navegador; q_auto ajusta la
// calidad sin que se note. Las URLs guardadas no cambian: el ajuste se hace
// solo al mostrarlas, así la IA y el panel siguen viendo el original.

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;

// Anchos para srcset: el navegador elige según el tamaño en pantalla y la
// densidad del teléfono. Los originales rondan los 800 px de ancho.
const ANCHOS = [400, 600, 800];

// Con alto, recorta un cuadro (miniaturas); sin alto, solo limita el ancho
// y conserva la proporción de la foto.
export function fotoAjustada(url, { ancho, alto } = {}) {
  if (!url || !CLOUDINARY.test(url) || !ancho) return url;
  const tamano = alto ? `c_fill,w_${ancho},h_${alto}` : `c_limit,w_${ancho}`;
  return url.replace(
    "/image/upload/",
    `/image/upload/${tamano},f_auto,q_auto/`
  );
}

// Fotos que no son de Cloudinary (las de /imagenes/) se muestran tal cual.
export function juegoDeFotos(url) {
  if (!url || !CLOUDINARY.test(url)) return undefined;
  return ANCHOS.map((a) => `${fotoAjustada(url, { ancho: a })} ${a}w`).join(
    ", "
  );
}
