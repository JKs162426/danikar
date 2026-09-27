import { useState } from "react";
import { useSesion } from "../contexto/SesionContext";
import { useContenidoAdmin } from "../hooks/useContenidoAdmin";
import ListaProductosAdmin from "../componentes/admin/ListaProductosAdmin";
import FormularioProducto from "../componentes/admin/FormularioProducto";
import "../estilos/admin.css";

export default function Admin() {
  const { salir } = useSesion();
  const c = useContenidoAdmin();
  const [pestana, setPestana] = useState("productos");
  const [productoEditando, setProductoEditando] = useState(null); // null | {} | producto

  if (c.estado === "cargando") return <p style={{ padding: 24 }}>Cargando…</p>;
  if (c.estado === "error")
    return <p style={{ padding: 24 }}>Error: {c.error}</p>;

  function manejarGuardarProducto(producto) {
    const lista = c.borrador.productos;
    const existe = lista.findIndex((p) => p.id === producto.id);
    const nueva =
      existe >= 0
        ? lista.map((p) => (p.id === producto.id ? producto : p))
        : [...lista, producto];
    c.editarProductos(nueva);
    setProductoEditando(null);
  }

  function manejarEliminar(id) {
    if (!window.confirm("¿Eliminar este producto?")) return;
    c.editarProductos(c.borrador.productos.filter((p) => p.id !== id));
  }

  function manejarToggle(id) {
    c.editarProductos(
      c.borrador.productos.map((p) =>
        p.id === id ? { ...p, disponible: !p.disponible } : p
      )
    );
  }

  return (
    <div className="admin-pagina">
      <div className="grosgrain" />

      <header className="admin-header">
        <h1>
          Panel DanKar <span>Admin</span>
        </h1>
        <button onClick={salir} className="btn-salir">
          Cerrar sesión
        </button>
      </header>

      <nav className="admin-tabs">
        {["productos", "negocio"].map((p) => (
          <button
            key={p}
            onClick={() => setPestana(p)}
            className={`admin-tab ${pestana === p ? "activo" : ""}`}
          >
            {p === "productos" ? "Productos" : "Datos del negocio"}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {pestana === "productos" && (
          <>
            <div className="admin-seccion-header">
              <h2>Productos ({c.borrador.productos.length})</h2>
              <button
                onClick={() => setProductoEditando({})}
                className="btn-primario"
              >
                + Nuevo producto
              </button>
            </div>
            <ListaProductosAdmin
              productos={c.borrador.productos}
              onEditar={setProductoEditando}
              onEliminar={manejarEliminar}
              onToggleDisponible={manejarToggle}
            />
          </>
        )}

        {pestana === "negocio" && (
          <p style={{ color: "var(--tinta-suave)" }}>
            Editor de datos del negocio — siguiente paso.
          </p>
        )}
      </main>

      {productoEditando !== null && (
        <FormularioProducto
          producto={
            Object.keys(productoEditando).length > 0 ? productoEditando : null
          }
          categorias={c.borrador.categorias}
          onGuardar={manejarGuardarProducto}
          onCerrar={() => setProductoEditando(null)}
        />
      )}

      {c.sucio && (
        <div className="admin-barra-guardado">
          <span>Cambios sin guardar</span>
          <div className="admin-barra-acciones">
            <button
              onClick={c.descartar}
              disabled={c.guardando}
              className="btn-secundario"
            >
              Descartar
            </button>
            <button
              onClick={c.guardar}
              disabled={c.guardando}
              className="btn-primario"
            >
              {c.guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {c.error && (
        <div className="admin-error-flotante">
          <strong>{c.error}</strong>
          {c.erroresCampo && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              {c.erroresCampo.map((d, i) => (
                <li key={i}>
                  {d.campo}: {d.mensaje}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
