import { useState } from "react";
import { formatearPrecio, precioMinimo } from "../../utils/whatsapp";

export default function TarjetaProducto({ producto, onElegir }) {
  const [imagenActiva, setImagenActiva] = useState(0);
  const minimo = precioMinimo(producto);
  const { imagenes } = producto;

  return (
    <article className="tarjeta">
      <div className="tarjeta-foto">
        {imagenes.length > 0 ? (
          <img
            src={imagenes[imagenActiva]}
            alt={producto.nombre}
            loading="lazy"
          />
        ) : (
          <span className="tarjeta-foto-vacia" aria-hidden="true">
            🎀
          </span>
        )}
        {producto.personalizable && (
          <span className="tarjeta-etiqueta">Personalizable</span>
        )}
      </div>

      {/* Miniaturas: solo si hay más de una */}
      {imagenes.length > 1 && (
        <div className="tarjeta-miniaturas">
          {imagenes.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setImagenActiva(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={imagenActiva === i}
              className={imagenActiva === i ? "activa" : ""}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="tarjeta-cuerpo">
        <p className="tarjeta-categoria">{producto.categoria}</p>
        <h3>{producto.nombre}</h3>
        {producto.descripcion && (
          <p className="tarjeta-descripcion">{producto.descripcion}</p>
        )}

        <p className="tarjeta-precio">
          {producto.variantes.length > 1 && <small>Desde </small>}
          {formatearPrecio(minimo)}
        </p>

        <button
          type="button"
          onClick={() => onElegir(producto)}
          className="boton boton-primario boton-ancho"
        >
          Elegir opciones
        </button>
      </div>
    </article>
  );
}
