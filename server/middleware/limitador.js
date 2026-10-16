import { ipConfiable, ipSegunVercel } from "./ip.js";

// Limitadores en memoria. Alcanzan para un solo proceso; si algún día
// corres más de una instancia, esto deja de servir.
const MINUTO = 60 * 1000;

// --- Login ---
const intentos = new Map();
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * MINUTO;
// Tope de la IP de Cloudflare cuando la petición dice venir por Vercel: esa
// IP es una salida de Vercel compartida por todas las visitas, así que con
// 5 se bloquearía de rebote a gente que no hizo nada.
const MAX_INTENTOS_SALIDA_VERCEL = 20;

// Cada intento se cuenta en todas sus claves y se bloquea si cualquiera se
// pasa. Las garantías son la clave "ip:" (Cloudflare, no se puede
// falsificar), que se cuenta siempre, y el tope global. La clave "vercel:"
// es un freno extra para quien no falsifica cabeceras (ver ip.js).
function clavesLogin(req) {
  const ip = `ip:${ipConfiable(req)}`;
  const vercel = ipSegunVercel(req);
  return vercel
    ? [
        { clave: `vercel:${vercel}`, maximo: MAX_INTENTOS },
        { clave: ip, maximo: MAX_INTENTOS_SALIDA_VERCEL },
      ]
    : [{ clave: ip, maximo: MAX_INTENTOS }];
}

// Respaldo que no depende de la IP. Si el servidor no logra ver la IP real
// (detrás de varios proxies cada petición puede parecer de alguien
// distinto), el límite por IP no frena nada; este sí. Con la IP bien
// detectada casi nunca se alcanza.
const MAX_FALLOS_GLOBALES = 30;
let fallosGlobales = [];

// Cada comprobación de bcrypt ocupa la CPU un rato. Sin tope, una
// avalancha de logins simultáneos dejaría al servidor sin aire.
const MAX_COMPARACIONES = 3;
let comparando = 0;

function demasiados(res, ms, mensaje) {
  const minutos = Math.max(1, Math.ceil(ms / MINUTO));
  return res.status(429).json({ error: `${mensaje} Intenta en ${minutos} min.` });
}

export function limitarLogin(req, res, next) {
  const ahora = Date.now();

  fallosGlobales = fallosGlobales.filter((t) => ahora - t < VENTANA_MS);
  if (fallosGlobales.length >= MAX_FALLOS_GLOBALES) {
    return demasiados(
      res,
      fallosGlobales[0] + VENTANA_MS - ahora,
      "El acceso al panel está pausado por seguridad."
    );
  }

  const claves = clavesLogin(req).map(({ clave, maximo }) => {
    let registro = intentos.get(clave);
    if (
      registro &&
      ahora >= registro.bloqueadoHasta &&
      ahora - registro.primerIntento > VENTANA_MS
    ) {
      registro = undefined;
    }
    return { clave, maximo, registro };
  });

  const bloqueada = claves.find(({ registro }) => registro && ahora < registro.bloqueadoHasta);
  if (bloqueada) {
    return demasiados(res, bloqueada.registro.bloqueadoHasta - ahora, "Demasiados intentos.");
  }

  // El intento cuenta ANTES de revisar la contraseña: si contara al fallar,
  // una ráfaga simultánea pasaría entera mientras bcrypt trabaja.
  let excedida = false;
  for (const c of claves) {
    c.registro ??= { conteo: 0, primerIntento: ahora, bloqueadoHasta: 0 };
    c.registro.conteo += 1;
    intentos.set(c.clave, c.registro);
    if (c.registro.conteo > c.maximo) {
      c.registro.bloqueadoHasta = ahora + VENTANA_MS;
      excedida = true;
    }
  }
  if (excedida) return demasiados(res, VENTANA_MS, "Demasiados intentos.");
  return next();
}

// Devuelve una función para liberar el cupo, o null si no hay cupo.
export function ocuparCupoComparacion() {
  if (comparando >= MAX_COMPARACIONES) return null;
  comparando += 1;
  let liberado = false;
  return () => {
    if (!liberado) comparando -= 1;
    liberado = true;
  };
}

export function registrarFallo() {
  fallosGlobales.push(Date.now());
}

export function limpiarIntentos(req) {
  for (const { clave } of clavesLogin(req)) intentos.delete(clave);
}

// --- Genérico: N peticiones por ventana, por IP ---
const ventanas = new Set();

export function limitarPeticiones({ maximo, ventanaMs, mensaje }) {
  const conteos = new Map();
  ventanas.add({ conteos, ventanaMs });

  return (req, res, next) => {
    const ahora = Date.now();
    const ip = ipConfiable(req);
    const registro = conteos.get(ip);

    if (!registro || ahora - registro.inicio > ventanaMs) {
      conteos.set(ip, { inicio: ahora, conteo: 1 });
      return next();
    }
    registro.conteo += 1;
    if (registro.conteo > maximo) {
      return res.status(429).json({ error: mensaje });
    }
    return next();
  };
}

// Sin esto los Map crecen para siempre con cada IP que pasa.
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, r] of intentos) {
    if (ahora > r.bloqueadoHasta && ahora - r.primerIntento > VENTANA_MS) {
      intentos.delete(ip);
    }
  }
  for (const { conteos, ventanaMs } of ventanas) {
    for (const [ip, r] of conteos) {
      if (ahora - r.inicio > ventanaMs) conteos.delete(ip);
    }
  }
}, 10 * MINUTO).unref();
