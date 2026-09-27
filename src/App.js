import { Routes, Route, Navigate } from "react-router-dom";
import { ProveedorSesion } from "./contexto/SesionContext";
import RutaProtegida from "./componentes/admin/RutaProtegida";
import Tienda from "./paginas/Tienda";
import Login from "./paginas/Login";
import Admin from "./paginas/Admin";

export default function App() {
  return (
    <ProveedorSesion>
      <Routes>
        <Route path="/" element={<Tienda />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RutaProtegida>
              <Admin />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProveedorSesion>
  );
}
