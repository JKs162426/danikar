import { useCallback, useEffect, useState } from "react";
import { obtenerContenidoPublico } from "../api/contenido";
import { useCarrito } from "../hooks/useCarrito";
import { enlaceWhatsapp, formatearPrecio } from "../utils/whatsapp";
import ListaProductos from "../componentes/tienda/ListaProductos";
import OpcionesProducto from "../componentes/tienda/OpcionesProducto";
import Carrito from "../componentes/tienda/Carrito";
import "../estilos/tienda.css";

const PASOS = [
  {
    emoji: "🎀",
    titulo: "Elige tus productos",
    texto: "Explora el catálogo y agrega a tu pedido lo que más te guste.",
  },
  {
    emoji: "🎨",
    titulo: "Color y tamaño",
    texto: "Selecciona las opciones y agrega una nota si quieres personalizarlo.",
  },
  {
    emoji: "💬",
    titulo: "Envía tu pedido",
    texto: "Te llevamos a WhatsApp con todo el resumen listo. Solo dale enviar.",
  },
];

export default function Tienda() {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null });
  const [lento, setLento] = useState(false);

  const cargar = useCallback(() => {
    let vigente = true;
    setEstado({ cargando: true, datos: null, error: null });
    setLento(false);
    // El servidor gratuito "duerme" y tarda en despertar: avisamos.
    const temporizador = setTimeout(() => vigente && setLento(true), 4000);

    obtenerContenidoPublico()
      .then((datos) => vigente && setEstado({ cargando: false, datos, error: null }))
      .catch(
        (error) =>
          vigente && setEstado({ cargando: false, datos: null, error: error.message })
      )
      .finally(() => clearTimeout(temporizador));

    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, []);

  useEffect(cargar, [cargar]);

  if (estado.cargando) {
    return (
      <div className="tienda-estado">
        <img src="/logo.png" alt="" className="tienda-estado-logo" />
        <p>Cargando la tienda…</p>
        {lento && <small>Estamos despertando el servidor, puede tardar unos segundos.</small>}
      </div>
    );
  }

  if (estado.error) {
    return (
      <div className="tienda-estado">
        <img src="/logo.png" alt="" className="tienda-estado-logo" />
        <p>No pudimos cargar la tienda.</p>
        <small>{estado.error}</small>
        <button type="button" onClick={cargar} className="boton boton-primario">
          Reintentar
        </button>
      </div>
    );
  }

  return <Catalogo {...estado.datos} />;
}

function Catalogo({ negocio, categorias, productos }) {
  const [categoria, setCategoria] = useState("todas");
  const [eligiendo, setEligiendo] = useState(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [aviso, setAviso] = useState(null);
  const carrito = useCarrito(productos);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  // Solo mostramos categorías que tienen algo: un filtro vacío confunde.
  const conProductos = categorias.filter((c) =>
    productos.some((p) => p.categoria === c)
  );
  const visibles =
    categoria === "todas"
      ? productos
      : productos.filter((p) => p.categoria === categoria);

  function agregar(eleccion) {
    carrito.agregar(eleccion);
    setAviso(`${eligiendo.nombre} se agregó a tu pedido`);
    setEligiendo(null);
  }

  return (
    <div className="tienda">
      <div className="grosgrain" />

      <header className="tienda-hero">
        <img src="/logo.png" alt="" className="tienda-logo" />
        <h1>{negocio.nombre}</h1>
        {negocio.descripcion && <p className="tienda-lema">{negocio.descripcion}</p>}
        {negocio.ubicacion && <p className="tienda-ubicacion">📍 {negocio.ubicacion}</p>}
      </header>

      <main className="tienda-main">
        <section className="pasos" aria-label="Cómo pedir">
          {PASOS.map((paso, i) => (
            <div key={paso.titulo} className="paso">
              <span className="paso-numero">{i + 1}</span>
              <span className="paso-emoji" aria-hidden="true">
                {paso.emoji}
              </span>
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
            </div>
          ))}
        </section>

        <aside className="banda-personalizado">
          <span aria-hidden="true">✨</span>
          <div>
            <h3>¿Lo quieres personalizado?</h3>
            <p>
              Colores de tu colegio, el nombre de tu niña o cualquier detalle
              especial. Agrégalo en la nota al elegir tu producto.
            </p>
          </div>
        </aside>

        <h2 className="tienda-subtitulo">Catálogo</h2>

        {conProductos.length > 1 && (
          <nav className="filtros" aria-label="Categorías">
            {["todas", ...conProductos].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                aria-pressed={categoria === c}
                className={`filtro ${categoria === c ? "activo" : ""}`}
              >
                {c}
              </button>
            ))}
          </nav>
        )}

        <ListaProductos productos={visibles} onElegir={setEligiendo} />
      </main>

      <Pie negocio={negocio} />

      {carrito.unidades > 0 && !carritoAbierto && (
        <button
          type="button"
          className="boton-carrito"
          onClick={() => setCarritoAbierto(true)}
        >
          <span aria-hidden="true">🛍️</span>
          Ver mi pedido
          <span className="boton-carrito-cuenta">{carrito.unidades}</span>
          <strong>{formatearPrecio(carrito.total)}</strong>
        </button>
      )}

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}

      {eligiendo && (
        <OpcionesProducto
          negocio={negocio}
          producto={eligiendo}
          onAgregar={agregar}
          onCerrar={() => setEligiendo(null)}
        />
      )}

      {carritoAbierto && (
        <Carrito
          negocio={negocio}
          carrito={carrito}
          onCerrar={() => setCarritoAbierto(false)}
        />
      )}
    </div>
  );
}

function Pie({ negocio }) {
  const whatsapp = enlaceWhatsapp(negocio.telefonoWhatsapp);

  return (
    <footer className="tienda-pie">
      <p className="tienda-pie-nombre">{negocio.nombre}</p>

      <div className="tienda-pie-enlaces">
        {negocio.instagram && (
          <a
            href={`https://instagram.com/${encodeURIComponent(negocio.instagram)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📸 @{negocio.instagram}
          </a>
        )}
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            💬 Escríbenos por WhatsApp
          </a>
        )}
      </div>

      {negocio.ubicacion && <p>📍 {negocio.ubicacion}</p>}
      {negocio.horario && <p>🕐 {negocio.horario}</p>}

      <hr />

      <p>
        Desarrollado por{" "}
        <a
          href="https://github.com/JKs162426"
          target="_blank"
          rel="noopener noreferrer"
          className="tienda-pie-credito"
        >
          Jesús Figueroa
        </a>
      </p>
      <a href="/admin/login" className="tienda-pie-admin">
        Administrar
      </a>
    </footer>
  );
}
