import { formatearBs, formatearPrecio } from "../../utils/whatsapp";

export default function Total({ dolares, tasa }) {
  const bs = formatearBs(dolares, tasa);
  return (
    <div className="opciones-total">
      <span>Total</span>
      <span className="total-monto">
        <strong>{formatearPrecio(dolares)}</strong>
        {bs && <small>{bs}</small>}
      </span>
    </div>
  );
}
