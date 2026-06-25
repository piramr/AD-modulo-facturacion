import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Download, FileText, RefreshCw, Users } from 'lucide-react'
import { toast } from 'react-toastify'
import PaginationControls from '../../components/facturacion/PaginationControls'
import PanelCard from '../../components/facturacion/PanelCard'
import { getReporteClientes, getReporteFacturas } from '../../api/facturacionService'

const formatMoney = (value) => `$${new Intl.NumberFormat('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
const formatDate = (value) => (value ? new Date(value).toLocaleDateString('es-EC') : '-')

export default function ReportesView() {
  const facturacion = useOutletContext()
  const [clientesReport, setClientesReport] = useState(null)
  const [facturasReport, setFacturasReport] = useState(null)
  const [clientesPage, setClientesPage] = useState(1)
  const [facturasPage, setFacturasPage] = useState(1)
  const [clientesLimit, setClientesLimit] = useState(10)
  const [facturasLimit, setFacturasLimit] = useState(10)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    Promise.all([
      getReporteClientes({ page: clientesPage, limit: clientesLimit }),
      getReporteFacturas({ page: facturasPage, limit: facturasLimit }),
    ])
      .then(([clientes, facturas]) => {
        if (!mounted) return
        setClientesReport(clientes)
        setFacturasReport(facturas)
      })
      .catch((error) => {
        if (mounted) toast.error(error.message || 'No fue posible cargar los reportes.')
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [clientesPage, clientesLimit, facturasPage, facturasLimit])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const [clientes, facturas] = await Promise.all([
        getReporteClientes({ page: clientesPage, limit: clientesLimit }),
        getReporteFacturas({ page: facturasPage, limit: facturasLimit }),
      ])
      setClientesReport(clientes)
      setFacturasReport(facturas)
    } catch (error) {
      toast.error(error.message || 'No fue posible cargar los reportes.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateClientesLimit = (limit) => {
    setIsLoading(true)
    setClientesLimit(limit)
    setClientesPage(1)
  }

  const updateFacturasLimit = (limit) => {
    setIsLoading(true)
    setFacturasLimit(limit)
    setFacturasPage(1)
  }

  const updateClientesPage = (page) => {
    setIsLoading(true)
    setClientesPage(page)
  }

  const updateFacturasPage = (page) => {
    setIsLoading(true)
    setFacturasPage(page)
  }

  const clientesPageInfo = {
    totalCount: clientesReport?.totalCount || 0,
    ...(clientesReport?.pageInfo || {}),
  }
  const facturasPageInfo = {
    totalCount: facturasReport?.totalCount || 0,
    ...(facturasReport?.pageInfo || {}),
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Reportes</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Consulta los reportes en GraphQL y descarga los documentos PDF.</p>
        </div>
        <button type="button" onClick={loadReports} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        <PanelCard title="Reporte de clientes">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{clientesReport?.totalCount ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">clientes registrados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={facturacion.handleDownloadClientesPdf} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700">
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>

          <PaginationControls
            compact
            disabled={isLoading}
            pageInfo={clientesPageInfo}
            onPageChange={updateClientesPage}
            pageSize={clientesLimit}
            onPageSizeChange={updateClientesLimit}
          />

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950">
                <tr>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Compras</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(clientesReport?.items || []).map((cliente) => (
                  <tr key={cliente.id}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{cliente.nombre}</p>
                      <p className="text-slate-500">{cliente.cedula}</p>
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{cliente.historialCompras.cantidadFacturas}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">{formatMoney(cliente.historialCompras.totalComprado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>

        <PanelCard title="Reporte de facturas">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{facturasReport?.totalCount ?? 0}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">facturas registradas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={facturacion.handleDownloadFacturasPdf} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700">
                <Download className="h-4 w-4" />
                PDF
              </button>
            </div>
          </div>

          <PaginationControls
            compact
            disabled={isLoading}
            pageInfo={facturasPageInfo}
            onPageChange={updateFacturasPage}
            pageSize={facturasLimit}
            onPageSizeChange={updateFacturasLimit}
          />

          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-950">
                <tr>
                  <th className="px-3 py-2">Factura</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(facturasReport?.items || []).map((factura) => (
                  <tr key={factura.id}>
                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">{factura.numeroFactura}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{factura.clienteNombre || '-'}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(factura.fechaEmision)}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100">{formatMoney(factura.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>
      </section>
    </div>
  )
}
