import { Navigate } from "react-router-dom";
import { useSesion } from "../../contexto/SesionContext";

export default function RutaProtegida({ children }) {
  const { autenticado, verificando } = useSesion();

  // Clave: mientras verifica NO redirige. Si redirigiera, cada recarga
  // del panel te mandaría al login aunque la cookie fuera válida.
  if (verificando) return <p className="admin-estado">Verificando…</p>;
  if (!autenticado) return <Navigate to="/admin/login" replace />;

  return children;
}
