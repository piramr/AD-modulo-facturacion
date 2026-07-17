// import { Outlet } from 'react-router-dom'
// import { useNavigate } from 'react-router-dom'
// import FacturacionLayout from '../components/facturacion/FacturacionLayout'
// import { useFacturacion } from '../hooks/useFacturacion'
// import ConfirmDialog from '../components/facturacion/ConfirmDialog'
// import { clearSession, getStoredUser } from '../api/authService'

// export default function FacturacionPage() {
//   const facturacion = useFacturacion()
//   const navigate = useNavigate()
//   const user = getStoredUser()

//   const handleLogout = () => {
//     clearSession()
//     facturacion.handleLogout()
//     navigate('/login', { replace: true })
//   }

//   return (
//     <>
//     <FacturacionLayout
//       currentSection={facturacion.currentSection}
//       sidebarOpen={facturacion.sidebarOpen}
//       onToggleSidebar={() => facturacion.setSidebarOpen((currentValue) => !currentValue)}
//       themeMode={facturacion.themeMode}
//       onToggleTheme={facturacion.toggleTheme}
//       userMenuOpen={facturacion.userMenuOpen}
//       onToggleUserMenu={() => facturacion.setUserMenuOpen((currentValue) => !currentValue)}
//       onLogout={handleLogout}
//       user={user}
//     >
//       <Outlet context={facturacion} />
//     </FacturacionLayout>
//     <ConfirmDialog
//         isOpen={facturacion.confirmDialog.isOpen}
//         title={facturacion.confirmDialog.title}
//         message={facturacion.confirmDialog.message}
//         onConfirm={facturacion.confirmDialog.onConfirm}
//         onCancel={facturacion.closeConfirmDialog}
//       />
//     </>
//   )
// }

import { Outlet, useNavigate } from "react-router-dom";
import FacturacionLayout from "../components/facturacion/FacturacionLayout";
import { useFacturacion } from "../hooks/useFacturacion";
import ConfirmDialog from "../components/facturacion/ConfirmDialog";
import { clearSession, getStoredUser } from "../api/authService";
import SeleccionCajaView from "./facturacion/SeleccionCajaView";

export default function FacturacionPage() {
  const facturacion = useFacturacion();
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearSession();
    facturacion.handleLogout();
    navigate("/login", { replace: true });
  };

  // Mientras se verifica la sesión activa, no renderizamos nada
  if (!facturacion.sesionCargada) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500">Verificando sesión de caja...</p>
      </div>
    );
  }

  // Si es cajero y no tiene turno abierto, mostrar pantalla de selección de caja
  if (
    facturacion.isCajero &&
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
        onToggleSidebar={() => facturacion.setSidebarOpen((v) => !v)}
        themeMode={facturacion.themeMode}
        onToggleTheme={facturacion.toggleTheme}
        userMenuOpen={facturacion.userMenuOpen}
        onToggleUserMenu={() => facturacion.setUserMenuOpen((v) => !v)}
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
