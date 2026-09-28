import { useEffect, useState } from "react";
import { obtenerContenidoPublico } from "../api/contenido";
import ListaProductos from "../componentes/tienda/ListaProductos";
import PedidoWhatsApp from "../componentes/tienda/PedidoWhatsApp";

export default function Tienda() {
  const [estado, setEstado] = useState({
    cargando: true,
    datos: null,
    error: null,
  });
  const [categoria, setCategoria] = useState("todas");
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    obtenerContenidoPublico()
      .then((datos) => setEstado({ cargando: false, datos, error: null }))
      .catch((error) =>
        setEstado({ cargando: false, datos: null, error: error.message })
      );
  }, []);

  if (estado.cargando) return <p style={{ padding: 24 }}>Cargando…</p>;
  if (estado.error) return <p style={{ padding: 24 }}>Error: {estado.error}</p>;

  const { negocio, categorias, productos } = estado.datos;

  const visibles =
    categoria === "todas"
      ? productos
      : productos.filter((p) => p.categoria === categoria);

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ color: "#c2185b", margin: 0 }}>{negocio.nombre}</h1>
        <p style={{ color: "#666", margin: "4px 0" }}>{negocio.descripcion}</p>
        {negocio.ubicacion && (
          <p style={{ color: "#999", fontSize: 14 }}>{negocio.ubicacion}</p>
        )}
      </header>

      <section
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {[
          {
            emoji: "🎀",
            titulo: "Elige tu producto",
            texto: "Explora el catálogo y encuentra el que más te guste.",
          },
          {
            emoji: "🎨",
            titulo: "Elige color y tamaño",
            texto:
              "Selecciona las opciones y agrega una nota si quieres personalizarlo.",
          },
          {
            emoji: "💬",
            titulo: "Envía tu pedido",
            texto:
              "Te redirigimos a WhatsApp con todo listo. Solo dale enviar.",
          },
        ].map((paso, i) => (
          <div
            key={i}
            style={{
              flex: "1 1 180px",
              background: "#fff",
              borderRadius: "var(--radio-lg)",
              padding: "20px 16px",
              textAlign: "center",
              boxShadow: "var(--sombra)",
              borderTop: "3px solid var(--fucsia)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{paso.emoji}</div>
            <h3
              style={{
                fontFamily: "var(--display)",
                fontSize: "var(--t-base)",
                color: "var(--tinta)",
                margin: "0 0 6px",
              }}
            >
              {paso.titulo}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "var(--t-sm)",
                color: "var(--tinta-suave)",
                lineHeight: 1.5,
              }}
            >
              {paso.texto}
            </p>
          </div>
        ))}
      </section>

      <div
        style={{
          background:
            "linear-gradient(135deg, var(--fucsia) 0%, var(--fucsia-hondo) 100%)",
          borderRadius: "var(--radio-lg)",
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 36 }}>✨</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3
            style={{
              fontFamily: "var(--display)",
              color: "#fff",
              margin: "0 0 4px",
              fontSize: "var(--t-lg)",
            }}
          >
            ¿Lo quieres personalizado?
          </h3>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.85)",
              fontSize: "var(--t-sm)",
              lineHeight: 1.5,
            }}
          >
            Colores de tu colegio, nombre de tu niña, o cualquier detalle
            especial. Agrégalo en la nota al hacer tu pedido.
          </p>
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
          justifyContent: "center",
        }}
      >
        {["todas", ...categorias].map((c) => (
          <button
            key={c}
            onClick={() => setCategoria(c)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #c2185b",
              background: categoria === c ? "#c2185b" : "transparent",
              color: categoria === c ? "#fff" : "#c2185b",
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </nav>

      <ListaProductos productos={visibles} onPedir={setPedido} />

      {pedido && (
        <PedidoWhatsApp
          negocio={negocio}
          producto={pedido}
          onCerrar={() => setPedido(null)}
        />
      )}

      <footer
        style={{
          marginTop: 60,
          padding: "32px 24px 24px",
          borderTop: "1px solid var(--linea)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        {/* Nombre del negocio */}
        <p
          style={{
            margin: 0,
            fontFamily: "var(--display)",
            fontSize: "var(--t-lg)",
            color: "var(--fucsia)",
          }}
        >
          {negocio.nombre}
        </p>

        {/* Instagram */}
        <a
          href="https://instagram.com/detalles_dankar"
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--tinta-suave)",
            fontSize: "var(--t-sm)",
            textDecoration: "none",
          }}
        >
          📸 @detalles_dankar
        </a>

        {/* WhatsApp directo */}
        <a
          href={`https://wa.me/${negocio.telefonoWhatsapp}`}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--tinta-suave)",
            fontSize: "var(--t-sm)",
            textDecoration: "none",
          }}
        >
          💬 Escríbenos por WhatsApp
        </a>

        {/* Ubicación */}
        <p
          style={{
            margin: 0,
            fontSize: "var(--t-xs)",
            color: "var(--tinta-suave)",
          }}
        >
          📍 Pariaguán, Anzoátegui, Venezuela
        </p>

        {/* Horario */}
        <p
          style={{
            margin: 0,
            fontSize: "var(--t-xs)",
            color: "var(--tinta-suave)",
          }}
        >
          🕐 Lunes a sábado, 9:00 a 18:00
        </p>

        <hr
          style={{
            width: "100%",
            border: "none",
            borderTop: "1px solid var(--linea)",
            margin: "8px 0",
          }}
        />

        {/* Créditos */}
        <p
          style={{
            margin: 0,
            fontSize: "var(--t-xs)",
            color: "var(--tinta-suave)",
          }}
        >
          Desarrollado por{" "}
          <a
            href="https://github.com/JKs162426"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--fucsia)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Jesús Figueroa
          </a>
        </p>

        {/* Admin oculto */}
        <a
          href="/admin/login"
          style={{
            fontSize: "var(--t-xs)",
            color: "var(--linea)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.target.style.color = "var(--tinta-suave)")}
          onMouseLeave={(e) => (e.target.style.color = "var(--linea)")}
        >
          Administrar
        </a>
      </footer>
    </main>
  );
}
