import { useOutletContext } from 'react-router-dom'
import MetricCard from '../../components/facturacion/MetricCard'
import PanelCard from '../../components/facturacion/PanelCard'

const incomeChannels = [
  { label: 'Cobros completados', value: '78%', width: '78%', tone: 'bg-emerald-500' },
  { label: 'Por conciliar', value: '22%', width: '22%', tone: 'bg-amber-500' },
]

export default function ResumenView() {
  const { kpis } = useOutletContext()

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => <MetricCard key={kpi.title} {...kpi} />)}
      </section>

      <section>
        <PanelCard title="Canales de ingresos">
          {incomeChannels.map((item) => (
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
