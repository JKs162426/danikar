import { useState } from "react";
import { formatearBs, formatearPrecio, precioMinimo } from "../../utils/whatsapp";
import { fotoAjustada, juegoDeFotos } from "../../utils/fotos";

export default function TarjetaProducto({ producto, tasa, onElegir }) {
  const [imagenActiva, setImagenActiva] = useState(0);
  const minimo = precioMinimo(producto);
  const minimoBs = formatearBs(minimo, tasa);
  const { imagenes } = producto;

  return (
    <article className="tarjeta">
      <div className="tarjeta-foto">
        {imagenes.length > 0 ? (
          <img
            src={fotoAjustada(imagenes[imagenActiva], { ancho: 800 })}
            srcSet={juegoDeFotos(imagenes[imagenActiva])}
            sizes="(max-width: 560px) 50vw, 360px"
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
              <img
                src={fotoAjustada(url, { ancho: 132, alto: 132 })}
                alt=""
                loading="lazy"
              />
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
          {minimoBs && <span className="tarjeta-precio-bs">{minimoBs}</span>}
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
