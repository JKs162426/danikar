import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSesion } from "../contexto/SesionContext";
import "../estilos/login.css";

export default function Login() {
  const { entrar, autenticado, verificando } = useSesion();
  const navegar = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (verificando) return <p className="admin-estado">Verificando…</p>;
  if (autenticado) return <Navigate to="/admin" replace />;

  async function manejarEnvio(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await entrar(password);
      navegar("/admin", { replace: true });
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-pagina">
      <div
        className="grosgrain"
        style={{ position: "fixed", top: 0, left: 0, right: 0 }}
      />

      <div className="login-card">
        <div className="login-marca">
          <h1>DanKar</h1>
          <p>Panel de administración</p>
        </div>

        <form onSubmit={manejarEnvio}>
          <label className="login-lbl">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              maxLength={200}
              autoFocus
              className="login-inp"
            />
          </label>

          <button
            type="submit"
            disabled={enviando || !password}
            className="login-btn"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
