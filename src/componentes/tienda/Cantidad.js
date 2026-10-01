import { MAX_CANTIDAD } from "../../hooks/useCarrito";

export default function Cantidad({ valor, onCambiar, etiqueta = "Cantidad" }) {
  return (
    <div className="cantidad" role="group" aria-label={etiqueta}>
      <button
        type="button"
        onClick={() => onCambiar(valor - 1)}
        disabled={valor <= 1}
        aria-label="Menos"
      >
        −
      </button>
      <span aria-live="polite">{valor}</span>
      <button
        type="button"
        onClick={() => onCambiar(valor + 1)}
        disabled={valor >= MAX_CANTIDAD}
        aria-label="Más"
      >
        +
      </button>
    </div>
  );
}
