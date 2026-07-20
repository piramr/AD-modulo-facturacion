import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import MetricCard from '../../components/facturacion/MetricCard'
import PanelCard from '../../components/facturacion/PanelCard'

const COLORES_ESTADO = {
  PAGADA: '#10b981',
  PAGO_PENDIENTE: '#f59e0b',
  ANULADA: '#ef4444',
}

const COLORES_PAGO = {
  EFECTIVO: '#b91c1c',
  CREDITO: '#1d4ed8',
}

const formatMoney = (value) =>
  `$${new Intl.NumberFormat('es-CO').format(Number(value) || 0)}`

const TooltipPersonalizado = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {label && <p className="mb-1 font-bold text-slate-700 dark:text-slate-200">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color || entry.fill }}>
          {entry.name}: <strong>{formatMoney(entry.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function ResumenView() {
  const { kpis, facturas, clientes } = useOutletContext()

  // ── Distribución de facturas por estado ──────────────────────────────────────
  const dataPorEstado = useMemo(() => {
    const conteo = {}
    facturas.forEach((f) => {
      conteo[f.estado] = (conteo[f.estado] || 0) + 1
    })
    return Object.entries(conteo).map(([estado, cantidad]) => ({
      name: estado.replace('_', ' '),
      value: cantidad,
      fill: COLORES_ESTADO[estado] || '#94a3b8',
    }))
  }, [facturas])

  // ── Ventas por tipo de pago ───────────────────────────────────────────────────
  const dataPorTipoPago = useMemo(() => {
    const totales = {}
    facturas
      .filter((f) => f.estado !== 'ANULADA')
      .forEach((f) => {
        totales[f.tipo_pago] = (totales[f.tipo_pago] || 0) + Number(f.total || 0)
      })
    return Object.entries(totales).map(([tipo, total]) => ({
      tipo,
      total: Number(total.toFixed(2)),
      fill: COLORES_PAGO[tipo] || '#94a3b8',
    }))
  }, [facturas])

  // ── Top 5 clientes por monto facturado ───────────────────────────────────────
  const dataTopClientes = useMemo(() => {
    const totalesPorCliente = {}
    facturas
      .filter((f) => f.estado !== 'ANULADA')
      .forEach((f) => {
        const nombre = f.clienteNombre || 'Sin nombre'
        totalesPorCliente[nombre] = (totalesPorCliente[nombre] || 0) + Number(f.total || 0)
      })
    return Object.entries(totalesPorCliente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, total]) => ({
        nombre: nombre.length > 16 ? nombre.slice(0, 16) + '…' : nombre,
        total: Number(total.toFixed(2)),
      }))
  }, [facturas])

  // ── Canales de ingreso reales ─────────────────────────────────────────────────
  const canalesIngreso = useMemo(() => {
    const totalGeneral = facturas
      .filter((f) => f.estado !== 'ANULADA')
      .reduce((sum, f) => sum + Number(f.total || 0), 0)

    const pagadas = facturas
      .filter((f) => f.estado === 'PAGADA')
      .reduce((sum, f) => sum + Number(f.total || 0), 0)

    const pendientes = facturas
      .filter((f) => f.estado === 'PAGO_PENDIENTE')
      .reduce((sum, f) => sum + Number(f.total || 0), 0)

    const pctPagadas = totalGeneral > 0 ? ((pagadas / totalGeneral) * 100).toFixed(0) : 0
    const pctPendientes = totalGeneral > 0 ? ((pendientes / totalGeneral) * 100).toFixed(0) : 0

    return [
      { label: 'Cobros completados', value: `${pctPagadas}%`, width: `${pctPagadas}%`, tone: 'bg-emerald-500' },
      { label: 'Por conciliar', value: `${pctPendientes}%`, width: `${pctPendientes}%`, tone: 'bg-amber-500' },
    ]
  }, [facturas])

  const sinDatos = facturas.length === 0

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => <MetricCard key={kpi.title} {...kpi} />)}
      </section>

      {sinDatos ? (
        <PanelCard>
          <p className="py-6 text-center text-sm text-slate-400">
            Aún no hay facturas registradas. Las gráficas aparecerán aquí cuando haya datos.
          </p>
        </PanelCard>
      ) : (
        <>
          {/* Fila 1 — Pie de estados + Barras tipo de pago */}
          <section className="grid gap-4 lg:grid-cols-2">

            <PanelCard title="Facturas por estado">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={dataPorEstado}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dataPorEstado.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </PanelCard>

            <PanelCard title="Ventas por tipo de pago">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dataPorTipoPago} barSize={40}>
                  <XAxis
                    dataKey="tipo"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `$${v}`}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
                    {dataPorTipoPago.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </PanelCard>
          </section>

          {/* Fila 2 — Top clientes + Canales de ingreso */}
          <section className="grid gap-4 lg:grid-cols-2">

            <PanelCard title="Top 5 clientes por facturación">
              {dataTopClientes.length === 0 ? (
                <p className="text-sm text-slate-400">Sin datos suficientes.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={dataTopClientes}
                    layout="vertical"
                    barSize={18}
                    margin={{ left: 8, right: 16 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip content={<TooltipPersonalizado />} />
                    <Bar dataKey="total" name="Total" fill="#b91c1c" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </PanelCard>

            <PanelCard title="Canales de ingreso">
              <div className="space-y-4">
                {canalesIngreso.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{item.label}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-full transition-all ${item.tone}`} style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Total clientes activos</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {clientes.filter((c) => c.estado === 'ACTIVO').length}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Total facturas emitidas</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{facturas.length}</span>
                  </div>
                </div>
              </div>
            </PanelCard>

          </section>
        </>
      )}
    </div>
  )
}