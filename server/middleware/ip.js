import { isIP } from "node:net";

// Cadena real de proxies, comprobada en los logs de Render (oct. 2026):
//   directo:    X-Forwarded-For = cliente, Cloudflare, Render
//   por Vercel: X-Forwarded-For = (lo que diga el cliente), Vercel, Cloudflare, Render
// La primera IP de la cadena la puede inventar cualquiera, y la última es
// un balanceador interno de Render que cambia en cada petición (por eso el
// límite por IP no frenaba nada).

const ipValida = (valor) => {
  const ip = valor?.trim();
  return ip && isIP(ip) ? ip : null;
};

// CF-Connecting-IP la pone Cloudflare con quien se le conectó, y Cloudflare
// rechaza las peticiones que intentan traerla falsa: el cliente no la
// puede elegir. Directo es la IP de la persona; por Vercel, la de Vercel.
export function ipConfiable(req) {
  return ipValida(req.get?.("cf-connecting-ip")) ?? req.ip;
}

// X-Vercel-Forwarded-For suele traer la IP real de la persona, pero NO es
// confiable: en las pruebas, algunos nodos de Vercel reemplazaron una IP
// falsa enviada por el cliente y otros la dejaron pasar, y quien llama
// directo a Render la puede inventar siempre. Sirve como freno extra para
// quien no se molesta en falsificarla, nunca como garantía: ver
// clavesLogin en limitador.js.
export function ipSegunVercel(req) {
  return ipValida(req.get?.("x-vercel-forwarded-for")?.split(",")[0]);
}
