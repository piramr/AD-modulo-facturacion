import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import PanelCard from '../../components/facturacion/PanelCard'
import { enrichCuentasConCXC, getPreferencias, getSaldosCuentas, updatePreferencias } from '../../api/facturacionService'

const inputClass = 'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-600 dark:focus:ring-slate-800 dark:disabled:bg-slate-900'
const labelClass = 'text-xs font-medium text-slate-500 dark:text-slate-400'

export default function AjustesView() {
  const [form, setForm] = useState({
    nombreEmpresa: '',
    rucEmpresa: '',
    porcentajeIva: '',
    cuentaBancariaDefaultId: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [cuentas, setCuentas] = useState([])

  useEffect(() => {
    let mounted = true

    Promise.all([getPreferencias(), getSaldosCuentas()])
      .then(([preferencias, cuentasData]) => {
        if (!mounted) return
        const cuentasLocales = cuentasData || []
        setCuentas(cuentasLocales)
        enrichCuentasConCXC(cuentasLocales)
          .then(setCuentas)
          .catch(() => {})
        setForm({
          nombreEmpresa: preferencias.nombreEmpresa || '',
          rucEmpresa: preferencias.rucEmpresa || '',
          porcentajeIva: String(preferencias.porcentajeIva ?? ''),
          cuentaBancariaDefaultId: preferencias.cuentaBancariaDefaultId || '',
        })
      })
      .catch((error) => {
        toast.error(error.message || 'No fue posible cargar los ajustes.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.nombreEmpresa.trim() || !form.rucEmpresa.trim() || form.porcentajeIva === '') {
      toast.error('Completa empresa, RUC y porcentaje de IVA.')
      return
    }

    setIsSaving(true)
    try {
      const preferencias = await updatePreferencias({
        nombreEmpresa: form.nombreEmpresa.trim(),
        rucEmpresa: form.rucEmpresa.trim(),
        porcentajeIva: Number(form.porcentajeIva),
        cuentaBancariaDefaultId: form.cuentaBancariaDefaultId.trim() || null,
      })

      setForm({
        nombreEmpresa: preferencias.nombreEmpresa || '',
        rucEmpresa: preferencias.rucEmpresa || '',
        porcentajeIva: String(preferencias.porcentajeIva ?? ''),
        cuentaBancariaDefaultId: preferencias.cuentaBancariaDefaultId || '',
      })
      toast.success('Ajustes actualizados correctamente.')
    } catch (error) {
      toast.error(error.message || 'No fue posible guardar los ajustes.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <PanelCard title="Ajustes del sistema">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className={labelClass}>Nombre de la empresa</span>
            <input
              value={form.nombreEmpresa}
              onChange={(event) => updateField('nombreEmpresa', event.target.value)}
              disabled={isLoading || isSaving}
              className={inputClass}
              placeholder="Mi empresa"
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>RUC</span>
            <input
              value={form.rucEmpresa}
              onChange={(event) => updateField('rucEmpresa', event.target.value)}
              disabled={isLoading || isSaving}
              className={inputClass}
              placeholder="0999999999001"
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Porcentaje de IVA</span>
            <input
              value={form.porcentajeIva}
              onChange={(event) => updateField('porcentajeIva', event.target.value)}
              disabled={isLoading || isSaving}
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              placeholder="15"
            />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Cuenta bancaria por defecto</span>
            <select
              value={form.cuentaBancariaDefaultId}
              onChange={(event) => updateField('cuentaBancariaDefaultId', event.target.value)}
              disabled={isLoading || isSaving}
              className={inputClass}
            >
              <option value="">Sin cuenta por defecto</option>
              {cuentas.map((cuenta) => (
                <option key={cuenta.cuentaId} value={cuenta.cuentaId}>
                  {cuenta.entidadBancaria || cuenta.nombre || cuenta.cuentaId}
                  {cuenta.nroCuenta ? ` - ${cuenta.nroCuenta}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isSaving}
            className="inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {isSaving ? 'Guardando...' : 'Guardar configuracion'}
          </button>
        </div>
      </PanelCard>
    </form>
  )
}
