import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../api/authService";
import ClientesView from "../pages/facturacion/ClientesView";
import FacturacionPage from "../pages/FacturacionPage";
import FacturasView from "../pages/facturacion/FacturasView";
import ReportesView from "../pages/facturacion/ReportesView";
import ResumenView from "../pages/facturacion/ResumenView";
import CajasView from "../pages/facturacion/CajasView";
import CuentasView from "../pages/facturacion/CuentasView";
import TurnosRevisionView from "../pages/facturacion/TurnosRevisionView";
import LoginPage from "../pages/LoginPage";

function ProtectedRoute({ children }) {
  return getStoredToken() ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const user = getStoredUser();
  const roles = (user?.roles || []).map((rol) => rol?.nombreRol?.toUpperCase?.() || "");
  const isAdmin = roles.some((rol) => rol.includes("ADMIN") || rol.includes("FAC_ADMIN"));
  return isAdmin ? children : <Navigate to="/facturacion/resumen" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={getStoredToken() ? "/facturacion/resumen" : "/login"} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/facturacion" element={<ProtectedRoute><FacturacionPage /></ProtectedRoute>}>
        <Route index element={<Navigate to="resumen" replace />} />
        <Route path="resumen" element={<ResumenView />} />
        <Route path="clientes" element={<ClientesView />} />
        <Route path="facturas" element={<FacturasView />} />
        <Route path="reportes" element={<ReportesView />} />
        <Route path="cajas" element={<CajasView />} />
        <Route path="cuentas" element={<CuentasView />} />
        <Route
          path="turnos-revision"
          element={
            <AdminRoute>
              <TurnosRevisionView />
            </AdminRoute>
          }
        />
      </Route>
      <Route
        path="*"
        element={<Navigate to={getStoredToken() ? "/facturacion/resumen" : "/login"} replace />}
      />
    </Routes>
  );
}
