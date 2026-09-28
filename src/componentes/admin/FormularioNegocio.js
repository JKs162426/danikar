import "../../estilos/admin.css";

export default function FormularioNegocio({ negocio, onChange }) {
  const set = (campo, valor) => onChange({ ...negocio, [campo]: valor });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <label className="form-lbl">
        Nombre del negocio
        <input
          value={negocio.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className="form-inp"
        />
      </label>

      <label className="form-lbl">
        Descripción
        <textarea
          value={negocio.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          rows={3}
          className="form-inp"
        />
      </label>

      <label className="form-lbl">
        Teléfono WhatsApp
        <input
          value={negocio.telefonoWhatsapp}
          onChange={(e) => set("telefonoWhatsapp", e.target.value)}
          placeholder="584121234567"
          className="form-inp"
        />
        <span
          style={{
            fontSize: "var(--t-xs)",
            color: "var(--tinta-suave)",
            marginTop: 4,
            display: "block",
          }}
        >
          Solo dígitos, con código de país y sin + ni espacios.
        </span>
      </label>

      <label className="form-lbl">
        Instagram
        <input
          value={negocio.instagram}
          onChange={(e) => set("instagram", e.target.value)}
          placeholder="detalles_dankar"
          className="form-inp"
        />
      </label>

      <label className="form-lbl">
        Ubicación
        <input
          value={negocio.ubicacion}
          onChange={(e) => set("ubicacion", e.target.value)}
          placeholder="Pariaguán, Anzoátegui, Venezuela"
          className="form-inp"
        />
      </label>

      <label className="form-lbl">
        Horario de atención
        <input
          value={negocio.horario ?? ""}
          onChange={(e) => set("horario", e.target.value)}
          placeholder="Lunes a sábado, 9:00 a 18:00"
          className="form-inp"
        />
      </label>

      <label className="form-lbl">
        Saludo de WhatsApp
        <input
          value={negocio.saludoPedido}
          onChange={(e) => set("saludoPedido", e.target.value)}
          className="form-inp"
        />
        <span
          style={{
            fontSize: "var(--t-xs)",
            color: "var(--tinta-suave)",
            marginTop: 4,
            display: "block",
          }}
        >
          Es el texto que encabeza cada mensaje de pedido.
        </span>
      </label>
    </div>
  );
}
