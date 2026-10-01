import { useEffect, useRef } from "react";

// variante: "centro" (diálogo) o "lateral" (panel que entra por la derecha;
// en el teléfono sube desde abajo).
export default function Modal({ titulo, onCerrar, variante = "centro", children }) {
  const panel = useRef(null);
  // En un ref para que el efecto corra una sola vez aunque el padre pase
  // una función nueva en cada render (si no, el foco saltaría al teclear).
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    const previo = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const alTeclear = (e) => e.key === "Escape" && cerrar.current();
    document.addEventListener("keydown", alTeclear);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", alTeclear);
      // Devuelve el foco a donde estaba (el botón que abrió el modal).
      previo?.focus?.();
    };
  }, []);

  return (
    <div className={`modal-fondo modal-${variante}`} onClick={onCerrar}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="modal-panel"
        // Sin esto, un clic dentro del panel burbujea al fondo y lo cierra.
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
