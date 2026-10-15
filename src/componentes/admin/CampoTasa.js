import { useEffect, useRef, useState } from "react";
import { formatearBs, formatearFechaTasa } from "../../utils/whatsapp";

// Acepta "36,50", "36.50" y "1.234,50". Devuelve null si está vacío y NaN
// si no es un número válido.
export function interpretarTasa(texto) {
  const limpio = texto.trim();
  if (!limpio) return null;
  const normal = limpio.includes(",")
    ? limpio.replace(/\./g, "").replace(",", ".")
    : limpio;
  if (!/^\d+(\.\d+)?$/.test(normal)) return NaN;
  const numero = Number(normal);
  return numero > 0 ? numero : NaN;
}

const comoTexto = (tasa) => (tasa == null ? "" : String(tasa).replace(".", ","));

function esDeHoy(iso) {
  return iso && new Date(iso).toDateString() === new Date().toDateString();
}

export default function CampoTasa({ tasa, actualizadaEn, onCambiar }) {
  // Texto propio: si el campo mostrara directamente el número, al escribir
  // "36," la coma desaparecería antes de poder poner los decimales.
  const [texto, setTexto] = useState(comoTexto(tasa));
  const [error, setError] = useState(null);
  const textoActual = useRef(texto);
  textoActual.current = texto;

  // Si la tasa cambia desde afuera (por ejemplo, al descartar cambios),
  // el campo se pone al día. Si cambió porque la escribimos aquí, no.
  useEffect(() => {
    if (interpretarTasa(textoActual.current) !== tasa) {
      setTexto(comoTexto(tasa));
      setError(null);
    }
  }, [tasa]);

  function alEscribir(valor) {
    setTexto(valor);
    // "36," o "36." es alguien a mitad de escribir los decimales: ni error
    // ni cambio todavía.
    if (/^\d[\d.]*[,.]$/.test(valor.trim())) {
      setError(null);
      return;
    }
    const numero = interpretarTasa(valor);
    if (Number.isNaN(numero)) {
      setError("Escribe solo el número, por ejemplo 36,50");
      return;
    }
    setError(null);
    onCambiar(numero, numero === null ? null : new Date().toISOString());
  }

  const fecha = formatearFechaTasa(actualizadaEn);

  return (
    <fieldset className="form-fs campo-tasa">
      <legend>Tasa del dólar</legend>

      <label className="form-lbl">
        Bolívares por $1
        <input
          value={texto}
          onChange={(e) => alEscribir(e.target.value)}
          inputMode="decimal"
          placeholder="Ej: 36,50"
          className="form-inp"
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <span className="form-ayuda form-ayuda-error">{error}</span>
        ) : (
          <span className="form-ayuda">
            {tasa
              ? `Un producto de $5.00 se verá como ${formatearBs(5, tasa)}.`
              : "Vacío: la tienda muestra solo precios en dólares."}
          </span>
        )}
      </label>

      {tasa && (
        <div className="campo-tasa-fecha">
          <span className={esDeHoy(actualizadaEn) ? "" : "campo-tasa-vieja"}>
            {fecha ? `Actualizada el ${fecha}` : "Sin fecha de actualización"}
            {!esDeHoy(actualizadaEn) && " · ¿sigue igual hoy?"}
          </span>
          <button
            type="button"
            onClick={() => onCambiar(tasa, new Date().toISOString())}
            disabled={esDeHoy(actualizadaEn)}
            className="btn-secundario"
          >
            Es la tasa de hoy
          </button>
        </div>
      )}
    </fieldset>
  );
}
