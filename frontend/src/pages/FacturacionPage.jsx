import { Outlet, useLocation, useNavigate } from "react-router-dom";
import FacturacionLayout from "../components/facturacion/FacturacionLayout";
import { useFacturacion } from "../hooks/useFacturacion";
import ConfirmDialog from "../components/facturacion/ConfirmDialog";
import { clearSession, getStoredUser } from "../api/authService";
import SeleccionCajaView from "./facturacion/SeleccionCajaView";

export default function FacturacionPage() {
  const facturacion = useFacturacion();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const handleLogout = () => {
    clearSession();
    facturacion.handleLogout();
    navigate("/login", { replace: true });
  };

  if (!facturacion.sesionCargada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500">Verificando sesion de caja...</p>
      </div>
    );
  }

  const requiereCajaAbierta = location.pathname.startsWith("/facturacion/facturas");

  if (
    facturacion.isCajero &&
    requiereCajaAbierta &&
    (!facturacion.sesionActiva || facturacion.sesionActiva.estado !== "ABIERTA")
  ) {
    return (
      <SeleccionCajaView
        cajas={facturacion.cajas}
        cajasLoading={facturacion.cajasLoading}
        sesionActiva={facturacion.sesionActiva}
        sesionForm={facturacion.sesionForm}
        setSesionForm={facturacion.setSesionForm}
        onAbrirSesion={facturacion.handleAbrirSesion}
        onRecargarCajas={facturacion.reloadCajas}
        isSubmitting={facturacion.isSubmitting}
        user={user}
        onLogout={handleLogout}
        themeMode={facturacion.themeMode}
        onToggleTheme={facturacion.toggleTheme}
      />
    );
  }

  return (
    <>
      <FacturacionLayout
        currentSection={facturacion.currentSection}
        sidebarOpen={facturacion.sidebarOpen}
        onToggleSidebar={() => facturacion.setSidebarOpen((value) => !value)}
        themeMode={facturacion.themeMode}
        onToggleTheme={facturacion.toggleTheme}
        userMenuOpen={facturacion.userMenuOpen}
        onToggleUserMenu={() => facturacion.setUserMenuOpen((value) => !value)}
        onLogout={handleLogout}
        user={user}
        sesionActiva={facturacion.sesionActiva}
        isCajero={facturacion.isCajero}
        onRevisarSesion={facturacion.openRevisarModal}
      >
        <Outlet context={facturacion} />
      </FacturacionLayout>
      <ConfirmDialog
        isOpen={facturacion.confirmDialog.isOpen}
        title={facturacion.confirmDialog.title}
        message={facturacion.confirmDialog.message}
        onConfirm={facturacion.confirmDialog.onConfirm}
        onCancel={facturacion.closeConfirmDialog}
      />
    </>
  );
}
