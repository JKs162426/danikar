import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { iniciarSesion, cerrarSesion, verificarSesion } from "../api/sesion";

const SesionContext = createContext(null);

export function ProveedorSesion({ children }) {
  // 'verificando' es un tercer estado, distinto de true/false. Sin él,
  // al recargar se vería un parpadeo del login antes de saber si
  // la cookie era válida.
  const [estado, setEstado] = useState("verificando");

  useEffect(() => {
    let vigente = true;

    verificarSesion()
      .then((hay) => vigente && setEstado(hay ? "autenticado" : "anonimo"))
      .catch(() => vigente && setEstado("anonimo"));

    // Evita actualizar estado si el componente ya se desmontó.
    return () => {
      vigente = false;
    };
  }, []);

  const entrar = useCallback(async (password) => {
    await iniciarSesion(password);
    setEstado("autenticado");
  }, []);

  const salir = useCallback(async () => {
    try {
      await cerrarSesion();
    } finally {
      // Pase lo que pase en el servidor, en el cliente ya no hay sesión.
      setEstado("anonimo");
    }
  }, []);

  return (
    <SesionContext.Provider
      value={{
        estado,
        autenticado: estado === "autenticado",
        verificando: estado === "verificando",
        entrar,
        salir,
      }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const contexto = useContext(SesionContext);
  if (!contexto)
    throw new Error("useSesion debe usarse dentro de ProveedorSesion");
  return contexto;
}
