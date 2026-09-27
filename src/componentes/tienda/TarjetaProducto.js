import { formatearPrecio } from "../../utils/whatsapp";

export default function TarjetaProducto({ producto, onPedir }) {
  // Los precios varían por tamaño; mostramos "desde" el más bajo.
  const precioMinimo = Math.min(...producto.variantes.map((v) => v.precio));

  return (
    <article
      style={{
        border: "1px solid #f0d5e4",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
      }}
    >
      {producto.imagenes.length > 0 && (
        <img
          src={producto.imagenes[0]}
          alt={producto.nombre}
          style={{
            width: "100%",
            aspectRatio: "1",
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      )}

      <h3 style={{ margin: "12px 0 4px" }}>{producto.nombre}</h3>

      {producto.descripcion && (
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "#666" }}>
          {producto.descripcion}
        </p>
      )}

      <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#c2185b" }}>
        {producto.variantes.length > 1
          ? `Desde ${formatearPrecio(precioMinimo)}`
          : formatearPrecio(precioMinimo)}
      </p>

      <button
        onClick={() => onPedir(producto)}
        style={{
          width: "100%",
          padding: 10,
          border: "none",
          borderRadius: 8,
          background: "#c2185b",
          color: "#fff",
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Pedir por WhatsApp
      </button>
    </article>
  );
}
