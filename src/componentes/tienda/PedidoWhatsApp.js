import { useState } from "react";
import {
  construirEnlace,
  construirMensaje,
  formatearPrecio,
  precioDeVariante,
} from "../../utils/whatsapp";

export default function PedidoWhatsApp({ negocio, producto, onCerrar }) {
  const [color, setColor] = useState(producto.colores[0] ?? "");
  const [tamano, setTamano] = useState(producto.variantes[0].tamano);
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");

  const datos = { negocio, producto, color, tamano, cantidad, nota };
  const enlace = construirEnlace(datos);
  const unitario = precioDeVariante(producto, tamano);

  return (
    <div
      onClick={onCerrar}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 10,
      }}
    >
      {/* Sin esto, un clic dentro del panel burbujea al fondo y lo cierra. */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          maxWidth: 400,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginTop: 0, color: "#c2185b" }}>{producto.nombre}</h2>

        {producto.colores.length > 0 && (
          <label style={{ display: "block", marginBottom: 12 }}>
            Color
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={campo}
            >
              {producto.colores.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}

        <label style={{ display: "block", marginBottom: 12 }}>
          Tamaño
          <select
            value={tamano}
            onChange={(e) => setTamano(e.target.value)}
            style={campo}
          >
            {producto.variantes.map((v) => (
              <option key={v.tamano} value={v.tamano}>
                {v.tamano} — {formatearPrecio(v.precio)}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Cantidad
          <input
            type="number"
            min="1"
            max="99"
            value={cantidad}
            onChange={(e) =>
              setCantidad(Math.max(1, Number(e.target.value) || 1))
            }
            style={campo}
          />
        </label>

        {producto.personalizable && (
          <label style={{ display: "block", marginBottom: 12 }}>
            Nota (personalización)
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              style={campo}
            />
          </label>
        )}

        <p style={{ fontWeight: 600, fontSize: 18 }}>
          Total: {formatearPrecio(unitario * cantidad)}
        </p>

        {/* Vista previa: tu tía recibe exactamente esto. */}
        <pre
          style={{
            background: "#faf3f7",
            padding: 10,
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {construirMensaje(datos)}
        </pre>

        <a
          href={enlace}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "block",
            textAlign: "center",
            padding: 12,
            background: "#25D366",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Enviar por WhatsApp
        </a>

        <button
          onClick={onCerrar}
          style={{
            width: "100%",
            marginTop: 8,
            padding: 10,
            background: "none",
            border: "none",
            color: "#666",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

const campo = {
  width: "100%",
  padding: 8,
  marginTop: 4,
  fontSize: 16,
  borderRadius: 6,
  border: "1px solid #ddd",
};
