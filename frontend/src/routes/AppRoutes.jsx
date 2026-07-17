import { Navigate, Route, Routes } from "react-router-dom";
import { getStoredToken } from "../api/authService";
import ClientesView from "../pages/facturacion/ClientesView";
import FacturacionPage from "../pages/FacturacionPage";
import FacturasView from "../pages/facturacion/FacturasView";
import ReportesView from "../pages/facturacion/ReportesView";
import ResumenView from "../pages/facturacion/ResumenView";
import CajasView from "../pages/facturacion/CajasView";
import LoginPage from "../pages/LoginPage";

function ProtectedRoute({ children }) {
  return getStoredToken() ? children : <Navigate to="/login" replace />;
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
      </Route>
      <Route
        path="*"
        element={<Navigate to={getStoredToken() ? "/facturacion/resumen" : "/login"} replace />}
      />
    </Routes>
  );
}
