import Icono from "../comun/Icono";
import { enlaceWhatsapp } from "../../utils/whatsapp";

const MENSAJE_IDEA = "Hola, tengo una idea especial y quisiera consultarte.";

export default function PieTienda({ negocio }) {
  const whatsapp = enlaceWhatsapp(negocio.telefonoWhatsapp);
  const whatsappIdea = enlaceWhatsapp(negocio.telefonoWhatsapp, MENSAJE_IDEA);
  const mapa =
    negocio.ubicacion &&
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      negocio.ubicacion
    )}`;
  const visitanos = negocio.ubicacion || negocio.horario;
  const compra = negocio.formasPago || negocio.entregas;

  return (
    <>
      {whatsappIdea && (
        <section className="pie-llamado">
          <div>
            <h2>¿No encuentras lo que buscas?</h2>
            <p>Cuéntanos tu idea y lo hacemos a tu medida.</p>
          </div>
          <a
            href={whatsappIdea}
            target="_blank"
            rel="noopener noreferrer"
            className="boton boton-whatsapp"
          >
            <Icono nombre="whatsapp" />
            Escríbenos
          </a>
        </section>
      )}

      <footer className="pie">
        <div className="grosgrain" />

        <div className="pie-columnas">
          <div className="pie-marca">
            <img src="/logo.png" alt="" width="64" height="64" />
            <p className="pie-nombre">{negocio.nombre}</p>
            {negocio.descripcion && <p>{negocio.descripcion}</p>}
          </div>

          <div>
            <h3>Contacto</h3>
            <ul>
              {whatsapp && (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <Icono nombre="whatsapp" />
                    WhatsApp
                  </a>
                </li>
              )}
              {negocio.instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${encodeURIComponent(
                      negocio.instagram
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icono nombre="instagram" />@{negocio.instagram}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {visitanos && (
            <div>
              <h3>Visítanos</h3>
              <ul>
                {negocio.ubicacion && (
                  <li>
                    <a href={mapa} target="_blank" rel="noopener noreferrer">
                      <Icono nombre="ubicacion" />
                      {negocio.ubicacion}
                    </a>
                  </li>
                )}
                {negocio.horario && (
                  <li>
                    <Icono nombre="horario" />
                    {negocio.horario}
                  </li>
                )}
              </ul>
            </div>
          )}

          {compra && (
            <div>
              <h3>Tu compra</h3>
              <ul>
                {negocio.formasPago && (
                  <li>
                    <Icono nombre="pago" />
                    {negocio.formasPago}
                  </li>
                )}
                {negocio.entregas && (
                  <li>
                    <Icono nombre="entrega" />
                    {negocio.entregas}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <p className="pie-credito">
          © {new Date().getFullYear()} {negocio.nombre} · Desarrollado por{" "}
          <a
            href="https://jfigueroa.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jesús Figueroa
          </a>
          {/* Discreto a propósito: es para la dueña, no para las clientas. */}
          <a href="/admin/login" className="pie-admin">
            Administrar
          </a>
        </p>
      </footer>
    </>
  );
}
