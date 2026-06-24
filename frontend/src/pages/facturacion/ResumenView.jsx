import { useOutletContext } from 'react-router-dom'
import MetricCard from '../../components/facturacion/MetricCard'
import PanelCard from '../../components/facturacion/PanelCard'

const actionLabels = {
  FACTURA_CREADA: 'Factura generada',
  FACTURA_IMPRESA: 'Factura impresa',
  FACTURA_ANULADA: 'Factura anulada',
  FACTURA_ACTUALIZADA: 'Factura actualizada',
  CREAR_CLIENTE: 'Cliente registrado',
  ACTUALIZAR_CLIENTE: 'Cliente actualizado',
  INACTIVAR_CLIENTE: 'Cliente inactivado',
}

function getAuditTitle(evento) {
  const label = actionLabels[evento.accion] || evento.accion
  const numeroFactura = evento.detalles?.numero_factura
  const clienteId = evento.detalles?.cliente_id

  if (numeroFactura) return `${label}: ${numeroFactura}`
  if (clienteId) return `${label}: ${clienteId}`
  return label
}

function getAuditDescription(evento) {
  const detalles = evento.detalles || {}
  const parts = []

  if (detalles.total !== undefined) parts.push(`Total $${Number(detalles.total).toFixed(2)}`)
  if (detalles.tipo_pago) parts.push(`Pago ${detalles.tipo_pago}`)
  if (detalles.estado_nuevo) parts.push(`Estado ${detalles.estado_nuevo}`)
  if (detalles.documento_bloqueado) parts.push('Documento bloqueado')

  const date = new Date(evento.fechaHora).toLocaleString('es-EC')
  return parts.length ? `${parts.join(' - ')} · ${date}` : date
}

export default function ResumenView() {
  const { kpis, auditoria } = useOutletContext()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{kpis.map((kpi) => <MetricCard key={kpi.title} {...kpi} />)}</section>
      <section className="grid gap-4 xl:grid-cols-2">
        <PanelCard title="Actividad de auditoria">
          <div className="space-y-4">
            {auditoria.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay eventos de auditoria registrados.</p>
            ) : auditoria.map((evento) => (
              <article key={evento.id} className="border-l-2 border-indigo-500 pl-4">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{getAuditTitle(evento)}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{getAuditDescription(evento)}</p>
              </article>
            ))}
          </div>
        </PanelCard>
        <PanelCard title="Canales de ingresos">
          {[{ label: 'Cobros completados', value: '78%', width: '78%', tone: 'bg-emerald-500' }, { label: 'Por conciliar', value: '22%', width: '22%', tone: 'bg-amber-500' }].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                <span className="font-bold">{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full ${item.tone}`} style={{ width: item.width }} />
              </div>
            </div>
          ))}
        </PanelCard>
      </section>
    </div>
  )
}
