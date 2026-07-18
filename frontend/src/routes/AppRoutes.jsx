import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredToken, getStoredUser } from "../api/authService";
import { getRoleFlags } from "../utils/roles";
import AjustesView from "../pages/facturacion/AjustesView";
import ClientesView from "../pages/facturacion/ClientesView";
import FacturacionPage from "../pages/FacturacionPage";
import FacturasView from "../pages/facturacion/FacturasView";
import ReportesView from "../pages/facturacion/ReportesView";
import ResumenView from "../pages/facturacion/ResumenView";
import CajasView from "../pages/facturacion/CajasView";
import CuentasView from "../pages/facturacion/CuentasView";
import TurnosRevisionView from "../pages/facturacion/TurnosRevisionView";
import LoginPage from "../pages/LoginPage";
import SaldosView from "../pages/facturacion/SaldosView";

function ProtectedRoute({ children }) {
  return getStoredToken() ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ allowedRoles, children }) {
  const flags = getRoleFlags(getStoredUser());
  const canEnter =
    allowedRoles.includes("admin") && flags.isAdmin ||
    allowedRoles.includes("cajero") && flags.isCajero;

  return canEnter ? children : <Navigate to="/facturacion/resumen" replace />;
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
        <Route path="clientes" element={<RoleRoute allowedRoles={["cajero"]}><ClientesView /></RoleRoute>} />
        <Route path="facturas" element={<RoleRoute allowedRoles={["cajero"]}><FacturasView /></RoleRoute>} />
        <Route path="reportes" element={<RoleRoute allowedRoles={["cajero"]}><ReportesView /></RoleRoute>} />
        <Route path="cajas" element={<RoleRoute allowedRoles={["admin"]}><CajasView /></RoleRoute>} />
        <Route path="turnos-revision" element={<RoleRoute allowedRoles={["admin"]}><TurnosRevisionView /></RoleRoute>} />
        <Route path="cuentas" element={<RoleRoute allowedRoles={["admin"]}><CuentasView /></RoleRoute>} />
        <Route path="saldos" element={<RoleRoute allowedRoles={["admin"]}><SaldosView /></RoleRoute>} />
        <Route path="ajustes" element={<RoleRoute allowedRoles={["admin"]}><AjustesView /></RoleRoute>} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={getStoredToken() ? "/facturacion/resumen" : "/login"} replace />}
      />
    </Routes>
  );
}
