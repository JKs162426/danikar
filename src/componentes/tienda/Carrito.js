import { useState } from "react";
import Modal from "../comun/Modal";
import Cantidad from "./Cantidad";
import { construirEnlace, formatearPrecio } from "../../utils/whatsapp";

export default function Carrito({ negocio, carrito, onCerrar }) {
  const { lineas, total, cambiarCantidad, quitar, vaciar } = carrito;
  // Tras abrir WhatsApp no sabemos si la clienta realmente envió el
  // mensaje, así que le preguntamos antes de vaciar.
  const [enviado, setEnviado] = useState(false);
  const enlace = construirEnlace({ negocio, lineas });

  return (
    <Modal titulo="Tu pedido" onCerrar={onCerrar} variante="lateral">
      <h2 className="modal-titulo">Tu pedido</h2>

      {lineas.length === 0 ? (
        <div className="carrito-vacio">
          <p aria-hidden="true">🎀</p>
          <p>Todavía no agregaste nada.</p>
          <button type="button" onClick={onCerrar} className="boton boton-secundario">
            Ver productos
          </button>
        </div>
      ) : (
        <>
          <ul className="carrito-lista">
            {lineas.map((l) => (
              <li key={l.clave} className="carrito-linea">
                {l.producto.imagenes[0] ? (
                  <img src={l.producto.imagenes[0]} alt="" />
                ) : (
                  <span className="carrito-linea-foto" aria-hidden="true">
                    🎀
                  </span>
                )}
                <div className="carrito-linea-info">
                  <p className="carrito-linea-nombre">{l.producto.nombre}</p>
                  <p className="carrito-linea-opciones">
                    {[l.color, l.tamano].filter(Boolean).join(" · ")}
                  </p>
                  {l.nota && <p className="carrito-linea-nota">“{l.nota}”</p>}
                  <div className="carrito-linea-pie">
                    <Cantidad
                      valor={l.cantidad}
                      onCambiar={(n) => cambiarCantidad(l.clave, n)}
                      etiqueta={`Cantidad de ${l.producto.nombre}`}
                    />
                    <strong>{formatearPrecio(l.precio * l.cantidad)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => quitar(l.clave)}
                  className="carrito-quitar"
                  aria-label={`Quitar ${l.producto.nombre}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <div className="carrito-pie">
            <div className="opciones-total">
              <span>Total</span>
              <strong>{formatearPrecio(total)}</strong>
            </div>

            {enviado ? (
              <div className="carrito-enviado">
                <p>¿Ya enviaste el mensaje en WhatsApp?</p>
                <button
                  type="button"
                  onClick={() => {
                    vaciar();
                    onCerrar();
                  }}
                  className="boton boton-primario boton-ancho"
                >
                  Sí, vaciar mi pedido
                </button>
                <button
                  type="button"
                  onClick={() => setEnviado(false)}
                  className="boton boton-enlace boton-ancho"
                >
                  Todavía no
                </button>
              </div>
            ) : (
              <>
                <a
                  href={enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setEnviado(true)}
                  className="boton boton-whatsapp boton-ancho"
                >
                  Enviar pedido por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => window.confirm("¿Vaciar todo el pedido?") && vaciar()}
                  className="boton boton-enlace boton-ancho"
                >
                  Vaciar pedido
                </button>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
