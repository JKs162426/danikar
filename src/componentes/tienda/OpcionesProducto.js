import { useState } from "react";
import Modal from "../comun/Modal";
import Cantidad from "./Cantidad";
import { MAX_CANTIDAD } from "../../hooks/useCarrito";
import {
  construirEnlace,
  formatearPrecio,
  precioDeVariante,
} from "../../utils/whatsapp";

export default function OpcionesProducto({ negocio, producto, onAgregar, onCerrar }) {
  const [color, setColor] = useState(producto.colores[0] ?? "");
  const [tamano, setTamano] = useState(producto.variantes[0].tamano);
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");

  const precio = precioDeVariante(producto, tamano);
  const eleccion = { productoId: producto.id, color, tamano, cantidad, nota };
  // "Pedir solo este" arma el mismo mensaje que el carrito, con una línea.
  const enlaceDirecto = construirEnlace({
    negocio,
    lineas: [{ ...eleccion, producto, precio }],
  });

  return (
    <Modal titulo={producto.nombre} onCerrar={onCerrar}>
      {producto.imagenes[0] && (
        <img src={producto.imagenes[0]} alt="" className="opciones-foto" />
      )}
      <h2 className="modal-titulo">{producto.nombre}</h2>
      {producto.descripcion && (
        <p className="opciones-descripcion">{producto.descripcion}</p>
      )}

      {producto.colores.length > 0 && (
        <fieldset className="opciones-grupo">
          <legend>Color</legend>
          <div className="chips">
            {producto.colores.map((c) => (
              <label key={c} className={`chip ${color === c ? "activo" : ""}`}>
                <input
                  type="radio"
                  name="color"
                  value={c}
                  checked={color === c}
                  onChange={() => setColor(c)}
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="opciones-grupo">
        <legend>Tamaño</legend>
        <div className="chips">
          {producto.variantes.map((v) => (
            <label
              key={v.tamano}
              className={`chip ${tamano === v.tamano ? "activo" : ""}`}
            >
              <input
                type="radio"
                name="tamano"
                value={v.tamano}
                checked={tamano === v.tamano}
                onChange={() => setTamano(v.tamano)}
              />
              {v.tamano} <small>{formatearPrecio(v.precio)}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="opciones-grupo">
        <legend>Cantidad</legend>
        <Cantidad
          valor={cantidad}
          onCambiar={(n) => setCantidad(Math.min(MAX_CANTIDAD, Math.max(1, n)))}
        />
      </fieldset>

      {producto.personalizable && (
        <label className="opciones-grupo opciones-nota">
          <span>Personalización (opcional)</span>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="Ej: colores del colegio, un nombre…"
          />
        </label>
      )}

      <div className="opciones-total">
        <span>Total</span>
        <strong>{formatearPrecio(precio * cantidad)}</strong>
      </div>

      <button
        type="button"
        onClick={() => onAgregar(eleccion)}
        className="boton boton-primario boton-ancho"
      >
        Agregar al pedido
      </button>

      {enlaceDirecto && (
        <a
          href={enlaceDirecto}
          target="_blank"
          rel="noopener noreferrer"
          className="boton boton-enlace boton-ancho"
        >
          O pedir solo este por WhatsApp
        </a>
      )}
    </Modal>
  );
}
