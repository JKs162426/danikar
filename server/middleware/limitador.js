// Limitador en memoria. Alcanza para un solo proceso; si algún día
// corres más de una instancia, esto deja de servir.
const intentos = new Map();
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

export function limitarLogin(req, res, next) {
  const registro = intentos.get(req.ip);
  const ahora = Date.now();

  if (registro && ahora < registro.bloqueadoHasta) {
    const segundos = Math.ceil((registro.bloqueadoHasta - ahora) / 1000);
    return res
      .status(429)
      .json({ error: `Demasiados intentos. Espera ${segundos}s.` });
  }
  if (registro && ahora - registro.primerIntento > VENTANA_MS) {
    intentos.delete(req.ip);
  }
  return next();
}

export function registrarFallo(ip) {
  const ahora = Date.now();
  const registro = intentos.get(ip) ?? {
    conteo: 0,
    primerIntento: ahora,
    bloqueadoHasta: 0,
  };
  registro.conteo += 1;

  if (registro.conteo >= MAX_INTENTOS) {
    registro.bloqueadoHasta = ahora + VENTANA_MS;
    registro.conteo = 0;
    registro.primerIntento = ahora;
  }
  intentos.set(ip, registro);
}

export function limpiarIntentos(ip) {
  intentos.delete(ip);
}
