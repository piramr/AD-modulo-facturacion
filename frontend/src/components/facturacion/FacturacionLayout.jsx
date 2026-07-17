import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigationGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Resumen', to: '/facturacion/resumen', icon: LayoutDashboard },
      { label: 'Cajas', to: '/facturacion/cajas', icon: BadgeDollarSign },
    ],
  },
  {
    label: 'Operacion',
    items: [
      { label: 'Clientes', to: '/facturacion/clientes', icon: Users },
      { label: 'Facturas', to: '/facturacion/facturas', icon: FileText },
      { label: 'Reportes', to: '/facturacion/reportes', icon: ClipboardList },
    ],
  },
]

function SidebarLink({ item, sidebarOpen }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end
      title={!sidebarOpen ? item.label : undefined}
      className={({ isActive }) =>
        [
          'group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
          sidebarOpen ? '' : 'justify-center px-0',
          isActive
            ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {sidebarOpen ? <span className="truncate">{item.label}</span> : null}
    </NavLink>
  )
}

export default function FacturacionLayout({
  currentSection,
  sidebarOpen,
  onToggleSidebar,
  themeMode,
  onToggleTheme,
  userMenuOpen,
  onToggleUserMenu,
  onLogout,
  user,
  children,
}) {
  const displayName = user?.userName || user?.user_name || 'Usuario'
  const displayEmail = user?.email || 'Sesion de facturacion'
  const roles = user?.roles || []
  const roleLabel = Array.isArray(roles) && roles.length > 0
    ? roles.map((rol) => rol.nombreRol || rol).join(', ')
    : 'Operador'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex min-h-screen">
        <aside
          className={[
            'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white/95 transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/95 lg:flex',
            sidebarOpen ? 'w-64' : 'w-16',
          ].join(' ')}
        >
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-3 dark:border-slate-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
              <Boxes className="h-5 w-5" />
            </div>
            {sidebarOpen ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-none">Facturacion</p>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">Modulo distribuido</p>
              </div>
            ) : null}
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                {sidebarOpen ? (
                  <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarLink key={item.to} item={item} sidebarOpen={sidebarOpen} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {sidebarOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
              {sidebarOpen ? <span>Contraer</span> : null}
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
            <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
              <button
                type="button"
                onClick={onToggleSidebar}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Alternar menu lateral"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <BarChart3 className="h-4 w-4" />
                  <span>Facturacion</span>
                </div>
                <h1 className="truncate text-base font-semibold leading-tight text-slate-950 dark:text-slate-50">
                  {currentSection}
                </h1>
              </div>

              <div className="hidden min-w-72 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:flex">
                <Search className="h-4 w-4" />
                <span className="truncate">Buscar clientes, facturas o cajas</span>
              </div>

              <button
                type="button"
                onClick={onToggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Cambiar tema"
              >
                {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleUserMenu}
                  className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-left transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-red-700 text-xs font-semibold text-white">
                    AJ
                  </span>
                  <span className="hidden min-w-0 md:block">
                    <span className="block truncate text-xs font-semibold leading-none">{displayName}</span>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">{roleLabel}</span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
                </button>

                {userMenuOpen ? (
                  <>
                    <button
                      type="button"
                      aria-label="Cerrar menu de usuario"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={onToggleUserMenu}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
                      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                        <p className="text-sm font-semibold">Sesion activa</p>
                        <p className="mt-1 text-xs text-slate-500">{displayEmail}</p>
                      </div>
                      <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-slate-50 dark:text-red-400 dark:hover:bg-slate-900"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesion
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
