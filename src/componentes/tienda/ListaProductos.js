import TarjetaProducto from "./TarjetaProducto";

export default function ListaProductos({ productos, onElegir }) {
  if (productos.length === 0) {
    return (
      <p className="lista-vacia">No hay productos en esta categoría todavía.</p>
    );
  }

  return (
    <div className="lista-productos">
      {productos.map((producto) => (
        <TarjetaProducto
          key={producto.id}
          producto={producto}
          onElegir={onElegir}
        />
      ))}
    </div>
  );
}
