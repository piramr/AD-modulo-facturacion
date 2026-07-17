import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react'
import { toast } from 'react-toastify'
import { getStoredToken, login } from '../api/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [themeMode, setThemeMode] = useState(() =>
    typeof window !== 'undefined' && window.document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  if (getStoredToken()) {
    return <Navigate to="/facturacion/resumen" replace />
  }

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(next)
    window.document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await login(username.trim(), password)
      toast.success('Sesion iniciada correctamente.')
      const redirectTo = location.state?.from?.pathname || '/facturacion/resumen'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      toast.error(error.message || 'No fue posible iniciar sesion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-white px-10 py-10 dark:border-slate-800 dark:bg-slate-950 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Modulo de Facturacion</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Aplicaciones Distribuidas</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Autenticacion centralizada con Seguridad
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-normal text-slate-950 dark:text-white">
                Gestiona cajas, clientes y facturas desde un acceso protegido.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                El modulo valida tu usuario, rol y permisos antes de mostrar las operaciones disponibles.
              </p>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <BadgeCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="mt-3 text-sm font-medium">Administrador</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Cajas, reportes y cierres.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <Sparkles className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <p className="mt-3 text-sm font-medium">Cajero</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Ventas, clientes y facturas.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:justify-end">
              <div className="flex items-center gap-3 lg:hidden">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Facturacion</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Acceso del modulo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Cambiar tema"
              >
                {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30"
            >
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-normal">Iniciar sesion</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Usa las credenciales asignadas en el modulo de Seguridad.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Usuario</span>
                  <span className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-500 transition-within focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:focus-within:border-slate-600 dark:focus-within:ring-slate-800">
                    <UserRound className="h-4 w-4" />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-100"
                      placeholder="Ingresa tu usuario"
                      autoComplete="username"
                    />
                  </span>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Contrasena</span>
                  <span className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-500 transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:focus-within:border-slate-600 dark:focus-within:ring-slate-800">
                    <KeyRound className="h-4 w-4" />
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-slate-100"
                      placeholder="Ingresa tu contrasena"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {isSubmitting ? 'Validando acceso...' : 'Ingresar al modulo'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}
