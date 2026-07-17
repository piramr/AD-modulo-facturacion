import { Outlet } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import FacturacionLayout from '../components/facturacion/FacturacionLayout'
import { useFacturacion } from '../hooks/useFacturacion'
import ConfirmDialog from '../components/facturacion/ConfirmDialog'
import { clearSession, getStoredUser } from '../api/authService'

export default function FacturacionPage() {
  const facturacion = useFacturacion()
  const navigate = useNavigate()
  const user = getStoredUser()

  const handleLogout = () => {
    clearSession()
    facturacion.handleLogout()
    navigate('/login', { replace: true })
  }

  return (
    <>
    <FacturacionLayout
      currentSection={facturacion.currentSection}
      sidebarOpen={facturacion.sidebarOpen}
      onToggleSidebar={() => facturacion.setSidebarOpen((currentValue) => !currentValue)}
      themeMode={facturacion.themeMode}
      onToggleTheme={facturacion.toggleTheme}
      userMenuOpen={facturacion.userMenuOpen}
      onToggleUserMenu={() => facturacion.setUserMenuOpen((currentValue) => !currentValue)}
      onLogout={handleLogout}
      user={user}
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
  )
}
