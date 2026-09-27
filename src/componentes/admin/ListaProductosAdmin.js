import { formatearPrecio } from "../../utils/whatsapp";
import "../../estilos/admin.css";

export default function ListaProductosAdmin({
  productos,
  onEditar,
  onEliminar,
  onToggleDisponible,
}) {
  if (productos.length === 0) {
    return (
      <div className="admin-producto-vacio">
        <p style={{ fontSize: "var(--t-lg)", marginBottom: 8 }}>🎀</p>
        <p>No hay productos todavía. Agrega uno con el botón de arriba.</p>
      </div>
    );
  }

  return (
    <div>
      {productos.map((p) => {
        const precios = p.variantes.map((v) => v.precio);
        const min = Math.min(...precios);
        const max = Math.max(...precios);
        const rango =
          min === max
            ? formatearPrecio(min)
            : `${formatearPrecio(min)} – ${formatearPrecio(max)}`;

        return (
          <div
            key={p.id}
            className={`admin-producto-item ${!p.disponible ? "oculto" : ""}`}
          >
            {p.imagenes?.[0] ? (
              <img
                src={p.imagenes[0]}
                alt={p.nombre}
                className="admin-producto-thumb"
              />
            ) : (
              <div className="admin-producto-thumb-placeholder">🎀</div>
            )}

            <div className="admin-producto-info">
              <p className="admin-producto-nombre">
                {p.nombre}
                {!p.disponible && <span className="badge-oculto">Oculto</span>}
              </p>
              <p className="admin-producto-meta">
                {p.categoria} · {rango}
                {p.colores.length > 0 &&
                  ` · ${p.colores.length} color${
                    p.colores.length > 1 ? "es" : ""
                  }`}
              </p>
            </div>

            <div className="admin-producto-acciones">
              <button
                onClick={() => onToggleDisponible(p.id)}
                className="btn-secundario"
              >
                {p.disponible ? "Ocultar" : "Mostrar"}
              </button>
              <button onClick={() => onEditar(p)} className="btn-secundario">
                Editar
              </button>
              <button onClick={() => onEliminar(p.id)} className="btn-peligro">
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
