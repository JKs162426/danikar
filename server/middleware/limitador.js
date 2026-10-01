// Limitadores en memoria. Alcanzan para un solo proceso; si algún día
// corres más de una instancia, esto deja de servir.
const MINUTO = 60 * 1000;

// --- Login: bloquea tras varios fallos seguidos ---
const intentos = new Map();
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * MINUTO;

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

// --- Genérico: N peticiones por ventana, por IP ---
const ventanas = new Set();

export function limitarPeticiones({ maximo, ventanaMs, mensaje }) {
  const conteos = new Map();
  ventanas.add({ conteos, ventanaMs });

  return (req, res, next) => {
    const ahora = Date.now();
    const registro = conteos.get(req.ip);

    if (!registro || ahora - registro.inicio > ventanaMs) {
      conteos.set(req.ip, { inicio: ahora, conteo: 1 });
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
