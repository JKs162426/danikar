import TarjetaProducto from "./TarjetaProducto";

export default function ListaProductos({ productos, onPedir }) {
  if (productos.length === 0) {
    return <p style={{ color: "#666" }}>No hay productos en esta categoría.</p>;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {productos.map((producto) => (
        <TarjetaProducto
          key={producto.id}
          producto={producto}
          onPedir={onPedir}
        />
      ))}
    </div>
  );
}
