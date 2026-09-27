import { useState, useRef } from "react";
import { subirImagen } from "../../api/contenido";
import "../../estilos/admin.css";

const TIPOS_AGARRE = ["pinza", "banda", "diadema", "gancho"];

const VACIO = {
  id: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  colores: [],
  variantes: [{ tamano: "Única", precio: 0 }],
  tipoAgarre: null,
  imagenes: [],
  personalizable: false,
  disponible: true,
};

function slugificar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function FormularioProducto({
  producto,
  categorias,
  onGuardar,
  onCerrar,
}) {
  const esNuevo = !producto;
  const [form, setForm] = useState(producto ?? VACIO);
  const [colorNuevo, setColorNuevo] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorImagen, setErrorImagen] = useState(null);
  const inputArchivo = useRef(null);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  // --- Colores ---
  function agregarColor() {
    const c = colorNuevo.trim();
    if (!c || form.colores.includes(c)) return;
    set("colores", [...form.colores, c]);
    setColorNuevo("");
  }
  const quitarColor = (i) =>
    set(
      "colores",
      form.colores.filter((_, j) => j !== i)
    );

  // --- Variantes ---
  const agregarVariante = () =>
    set("variantes", [...form.variantes, { tamano: "", precio: 0 }]);

  function editarVariante(i, campo, valor) {
    const v = [...form.variantes];
    v[i] = {
      ...v[i],
      [campo]: campo === "precio" ? Number(valor) || 0 : valor,
    };
    set("variantes", v);
  }
  const quitarVariante = (i) => {
    if (form.variantes.length === 1) return;
    set(
      "variantes",
      form.variantes.filter((_, j) => j !== i)
    );
  };

  // --- Imágenes ---
  async function manejarArchivo(e) {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendo(true);
    setErrorImagen(null);
    try {
      const url = await subirImagen(archivo);
      set("imagenes", [...form.imagenes, url]);
    } catch (err) {
      setErrorImagen(err.message);
    } finally {
      setSubiendo(false);
      inputArchivo.current.value = "";
    }
  }
  const quitarImagen = (i) =>
    set(
      "imagenes",
      form.imagenes.filter((_, j) => j !== i)
    );

  // --- Guardar ---
  function manejarGuardar() {
    const id =
      form.id.trim() ||
      slugificar(form.nombre) + "-" + Math.random().toString(36).slice(2, 5);
    onGuardar({ ...form, id });
  }

  const invalido =
    !form.nombre.trim() ||
    !form.categoria.trim() ||
    form.variantes.some((v) => !v.tamano.trim() || v.precio < 0);

  return (
    <div onClick={onCerrar} className="form-overlay">
      <div onClick={(e) => e.stopPropagation()} className="form-panel">
        <h2>{esNuevo ? "Nuevo producto" : "Editar producto"}</h2>

        {/* Nombre */}
        <label className="form-lbl">
          Nombre *
          <input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Lazo clásico"
            className="form-inp"
          />
        </label>

        {/* Descripción */}
        <label className="form-lbl">
          Descripción
          <textarea
            value={form.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            rows={2}
            className="form-inp"
          />
        </label>

        {/* Categoría */}
        <label className="form-lbl">
          Categoría *
          <select
            value={form.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            className="form-inp"
          >
            <option value="">— selecciona —</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {/* Tipo de agarre */}
        <label className="form-lbl">
          Tipo de agarre
          <select
            value={form.tipoAgarre ?? ""}
            onChange={(e) => set("tipoAgarre", e.target.value || null)}
            className="form-inp"
          >
            <option value="">— ninguno —</option>
            {TIPOS_AGARRE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Variantes */}
        <fieldset className="form-fs">
          <legend>Tamaños y precios *</legend>
          {form.variantes.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={v.tamano}
                placeholder="Ej: Mediano"
                onChange={(e) => editarVariante(i, "tamano", e.target.value)}
                className="form-inp"
                style={{ flex: 2, marginTop: 0 }}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                value={v.precio}
                onChange={(e) => editarVariante(i, "precio", e.target.value)}
                className="form-inp"
                style={{ flex: 1, marginTop: 0 }}
              />
              <button
                onClick={() => quitarVariante(i)}
                disabled={form.variantes.length === 1}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: 22,
                  padding: "0 4px",
                  opacity: form.variantes.length === 1 ? 0.3 : 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={agregarVariante} className="btn-secundario">
            + Agregar tamaño
          </button>
        </fieldset>

        {/* Colores */}
        <fieldset className="form-fs">
          <legend>Colores disponibles</legend>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 10,
            }}
          >
            {form.colores.map((c, i) => (
              <span key={i} className="chip-color">
                {c}
                <button onClick={() => quitarColor(i)}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={colorNuevo}
              placeholder="Ej: Azul rey"
              onChange={(e) => setColorNuevo(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), agregarColor())
              }
              className="form-inp"
              style={{ flex: 1, marginTop: 0 }}
            />
            <button onClick={agregarColor} className="btn-secundario">
              Agregar
            </button>
          </div>
        </fieldset>

        {/* Imágenes */}
        <fieldset className="form-fs">
          <legend>Imágenes</legend>

          <div className="form-imagen-grid">
            {form.imagenes.map((url, i) => (
              <div key={i} className="form-imagen-thumb">
                <img src={url} alt="" />
                <button
                  onClick={() => quitarImagen(i)}
                  className="form-imagen-quitar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <input
            ref={inputArchivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={manejarArchivo}
            disabled={subiendo || form.imagenes.length >= 8}
            style={{ display: "none" }}
          />

          <button
            onClick={() => inputArchivo.current.click()}
            disabled={subiendo || form.imagenes.length >= 8}
            className="btn-secundario"
          >
            {subiendo ? "Subiendo…" : "+ Agregar imagen"}
          </button>

          {form.imagenes.length >= 8 && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "var(--t-xs)",
                color: "var(--tinta-suave)",
              }}
            >
              Máximo 8 imágenes por producto.
            </p>
          )}
          {errorImagen && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "var(--t-xs)",
                color: "#dc2626",
              }}
            >
              {errorImagen}
            </p>
          )}
        </fieldset>

        {/* Checkboxes */}
        <div style={{ display: "flex", gap: 24, marginBottom: 8 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: "var(--t-sm)",
            }}
          >
            <input
              type="checkbox"
              checked={form.personalizable}
              onChange={(e) => set("personalizable", e.target.checked)}
            />
            Personalizable
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontSize: "var(--t-sm)",
            }}
          >
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={(e) => set("disponible", e.target.checked)}
            />
            Visible en la tienda
          </label>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button onClick={onCerrar} className="btn-secundario">
            Cancelar
          </button>
          <button
            onClick={manejarGuardar}
            disabled={invalido}
            className="btn-primario"
          >
            {esNuevo ? "Agregar producto" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
