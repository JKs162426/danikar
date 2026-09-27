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
          paddingTop: 20,
          borderTop: "1px solid var(--linea)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
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

        <a
          href="/admin/login"
          style={{
            fontSize: "var(--t-xs)",
            color: "var(--linea)",
            textDecoration: "none",
            transition: "color 0.15s",
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
