import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ProveedorSesion } from "./contexto/SesionContext";
import RutaProtegida from "./componentes/admin/RutaProtegida";
import Tienda from "./paginas/Tienda";
import Login from "./paginas/Login";
import Admin from "./paginas/Admin";

// La sesión solo importa en /admin. Si envolviera toda la app, cada
// clienta que abre la tienda dispararía una verificación inútil (un 401).
function ConSesion() {
  return (
    <ProveedorSesion>
      <Outlet />
    </ProveedorSesion>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Tienda />} />
      <Route element={<ConSesion />}>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <Admin />
            </RutaProtegida>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
