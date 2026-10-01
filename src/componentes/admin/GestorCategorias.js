import { useState } from "react";
import "../../estilos/admin.css";

const MAX_LARGO = 60;

// Devuelve un mensaje de error o null si el nombre sirve.
function validar(nombre, categorias, actual = null) {
  const limpio = nombre.trim();
  if (!limpio) return "Escribe un nombre.";
  if (limpio.length > MAX_LARGO) return `Máximo ${MAX_LARGO} caracteres.`;
  const repetida = categorias.some(
    (c) => c !== actual && c.toLowerCase() === limpio.toLowerCase()
  );
  return repetida ? "Ya existe una categoría con ese nombre." : null;
}

export default function GestorCategorias({ categorias, productos, onCambiar }) {
  const [nueva, setNueva] = useState("");
  const [errorNueva, setErrorNueva] = useState(null);
  const [editando, setEditando] = useState(null); // { original, valor, error }
  const [eliminando, setEliminando] = useState(null); // { categoria, destino }

  const usos = (c) => productos.filter((p) => p.categoria === c).length;

  function agregar(e) {
    e.preventDefault();
    const error = validar(nueva, categorias);
    if (error) return setErrorNueva(error);
    onCambiar({ categorias: [...categorias, nueva.trim()], productos });
    setNueva("");
    setErrorNueva(null);
  }

  function confirmarRenombre() {
    const { original, valor } = editando;
    const error = validar(valor, categorias, original);
    if (error) return setEditando({ ...editando, error });
    const nombre = valor.trim();
    // Renombrar arrastra a sus productos: si no, quedarían apuntando a
    // una categoría que ya no existe y el servidor rechazaría el guardado.
    onCambiar({
      categorias: categorias.map((c) => (c === original ? nombre : c)),
      productos: productos.map((p) =>
        p.categoria === original ? { ...p, categoria: nombre } : p
      ),
    });
    setEditando(null);
  }

  function pedirEliminar(categoria) {
    if (usos(categoria) === 0) {
      if (!window.confirm(`¿Eliminar la categoría "${categoria}"?`)) return;
      onCambiar({ categorias: categorias.filter((c) => c !== categoria), productos });
      return;
    }
    const destino = categorias.find((c) => c !== categoria);
    setEliminando({ categoria, destino });
  }

  function confirmarEliminar() {
    const { categoria, destino } = eliminando;
    onCambiar({
      categorias: categorias.filter((c) => c !== categoria),
      productos: productos.map((p) =>
        p.categoria === categoria ? { ...p, categoria: destino } : p
      ),
    });
    setEliminando(null);
  }

  function mover(i, direccion) {
    const lista = [...categorias];
    const j = i + direccion;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    onCambiar({ categorias: lista, productos });
  }

  return (
    <div>
      <p className="admin-ayuda">
        El orden de esta lista es el orden de los filtros en la tienda. Las
        categorías sin productos no se muestran a las clientas.
      </p>

      <ul className="cat-lista">
        {categorias.map((c, i) => {
          const n = usos(c);
          const enEdicion = editando?.original === c;
          const enEliminacion = eliminando?.categoria === c;

          return (
            <li key={c} className="cat-item">
              <div className="cat-orden">
                <button
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  aria-label={`Subir ${c}`}
                >
                  ▲
                </button>
                <button
                  onClick={() => mover(i, 1)}
                  disabled={i === categorias.length - 1}
                  aria-label={`Bajar ${c}`}
                >
                  ▼
                </button>
              </div>

              {enEdicion ? (
                <form
                  className="cat-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    confirmarRenombre();
                  }}
                >
                  <input
                    value={editando.valor}
                    onChange={(e) =>
                      setEditando({ ...editando, valor: e.target.value, error: null })
                    }
                    maxLength={MAX_LARGO}
                    autoFocus
                    className="form-inp"
                    aria-label="Nuevo nombre"
                  />
                  <button type="submit" className="btn-primario">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(null)}
                    className="btn-secundario"
                  >
                    Cancelar
                  </button>
                  {editando.error && <p className="cat-error">{editando.error}</p>}
                </form>
              ) : enEliminacion ? (
                <div className="cat-form">
                  <span className="cat-aviso">
                    {n === 1 ? "Mover su producto a:" : `Mover sus ${n} productos a:`}
                  </span>
                  <select
                    value={eliminando.destino}
                    onChange={(e) =>
                      setEliminando({ ...eliminando, destino: e.target.value })
                    }
                    className="form-inp"
                  >
                    {categorias
                      .filter((otra) => otra !== c)
                      .map((otra) => (
                        <option key={otra} value={otra}>
                          {otra}
                        </option>
                      ))}
                  </select>
                  <button onClick={confirmarEliminar} className="btn-peligro">
                    Mover y eliminar
                  </button>
                  <button onClick={() => setEliminando(null)} className="btn-secundario">
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <div className="cat-info">
                    <p className="cat-nombre">{c}</p>
                    <p className="admin-producto-meta">
                      {n === 0 ? "Sin productos" : `${n} producto${n > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="admin-producto-acciones">
                    <button
                      onClick={() => {
                        setEliminando(null);
                        setEditando({ original: c, valor: c, error: null });
                      }}
                      className="btn-secundario"
                    >
                      Renombrar
                    </button>
                    <button
                      onClick={() => {
                        setEditando(null);
                        pedirEliminar(c);
                      }}
                      disabled={categorias.length === 1}
                      title={
                        categorias.length === 1
                          ? "Debe quedar al menos una categoría"
                          : undefined
                      }
                      className="btn-peligro"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={agregar} className="cat-nueva">
        <input
          value={nueva}
          onChange={(e) => {
            setNueva(e.target.value);
            setErrorNueva(null);
          }}
          maxLength={MAX_LARGO}
          placeholder="Nueva categoría, ej: collares"
          className="form-inp"
          aria-label="Nueva categoría"
        />
        <button type="submit" className="btn-primario" disabled={!nueva.trim()}>
          + Agregar
        </button>
      </form>
      {errorNueva && <p className="cat-error">{errorNueva}</p>}
    </div>
  );
}
