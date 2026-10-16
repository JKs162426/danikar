import { isIP } from "node:net";

// Cadena real de proxies, comprobada en los logs de Render (oct. 2026):
//   directo:    X-Forwarded-For = cliente, Cloudflare, Render
//   por Vercel: X-Forwarded-For = (lo que diga el cliente), Vercel, Cloudflare, Render
// La primera IP de la cadena la puede inventar cualquiera, y la última es
// un balanceador interno de Render que cambia en cada petición (por eso el
// límite por IP no frenaba nada). CF-Connecting-IP la pone Cloudflare con
// quien se le conectó, y Cloudflare rechaza las peticiones que intentan
// traerla falsa: es la única IP que el cliente no puede elegir. Por Vercel
// es la IP de Vercel, no la de la persona; para ese camino está el tope
// global del limitador de login.
export function ipConfiable(req) {
  const cf = req.get?.("cf-connecting-ip")?.trim();
  return cf && isIP(cf) ? cf : req.ip;
}
