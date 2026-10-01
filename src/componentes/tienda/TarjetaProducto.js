import { useState } from "react";
import { formatearPrecio } from "../../utils/whatsapp";

export default function TarjetaProducto({ producto, onPedir }) {
  const precioMinimo = Math.min(...producto.variantes.map((v) => v.precio));
  const [imagenActiva, setImagenActiva] = useState(0);

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
        <>
          {/* Imagen principal */}
          <img
            src={producto.imagenes[imagenActiva]}
            alt={producto.nombre}
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              borderRadius: 8,
              transition: "opacity 0.2s",
            }}
          />

          {/* Miniaturas — solo si hay más de una */}
          {producto.imagenes.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {producto.imagenes.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${producto.nombre} ${i + 1}`}
                  onClick={() => setImagenActiva(i)}
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 6,
                    cursor: "pointer",
                    border:
                      imagenActiva === i
                        ? "2px solid var(--fucsia)"
                        : "2px solid transparent",
                    opacity: imagenActiva === i ? 1 : 0.6,
                    transition: "opacity 0.15s, border-color 0.15s",
                  }}
                />
              ))}
            </div>
          )}
        </>
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
