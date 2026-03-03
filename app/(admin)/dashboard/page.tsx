'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MetricCard } from '@/components/admin/MetricCard'
import { Card } from '@/components/ui/Card'
import { PedidoRow } from '@/components/admin/PedidoRow'
import { formatPrice } from '@/lib/utils'
import { RealtimePedidos } from '@/components/shared/RealtimeProvider'
import { SkeletonMetric, SkeletonTable } from '@/components/ui/Skeleton'
import { RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  const [metricas, setMetricas] = useState({
    faturamentoDia: 0,
    faturamentoSemana: 0,
    faturamentoMes: 0,
    ticketMedio: 0,
    pedidosPendentes: 0,
  })
  const [ultimosPedidos, setUltimosPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)

  const fetchDados = async () => {
    setAtualizando(true)
    const supabase = createClient()
    const hoje = new Date()
    const semanaAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000)
    const mesAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('*')
      .eq('status', 'pago')
      .gte('criado_em', mesAtras.toISOString())

    const hojeStr = hoje.toISOString().split('T')[0]
    const semanaAtrasStr = semanaAtras.toISOString()

    const pedidosDia = pedidos?.filter((p) => p.criado_em.startsWith(hojeStr)) || []
    const pedidosSemana = pedidos?.filter((p) => p.criado_em >= semanaAtrasStr) || []

    const faturamentoDia = pedidosDia.reduce((sum, p) => sum + (p.total || 0), 0)
    const faturamentoSemana = pedidosSemana.reduce((sum, p) => sum + (p.total || 0), 0)
    const faturamentoMes = pedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0
    const ticketMedio = pedidos && pedidos.length > 0 ? faturamentoMes / pedidos.length : 0

    const { data: pendentes } = await supabase
      .from('pedidos')
      .select('id')
      .in('status', ['novo', 'pago', 'em_preparo'])

    setMetricas({
      faturamentoDia,
      faturamentoSemana,
      faturamentoMes,
      ticketMedio,
      pedidosPendentes: pendentes?.length || 0,
    })

    const { data: ultimos } = await supabase
      .from('pedidos')
      .select('*, clientes(nome)')
      .order('criado_em', { ascending: false })
      .limit(5)

    setUltimosPedidos(ultimos || [])
    setLoading(false)
    setAtualizando(false)
  }

  useEffect(() => {
    fetchDados()
  }, [])

  return (
    <div>
      <RealtimePedidos onUpdate={fetchDados} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D2240]">Dashboard</h1>
        <button
          onClick={fetchDados}
          disabled={atualizando}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#0D2240] transition"
        >
          <RefreshCw size={16} className={atualizando ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonMetric key={i} />
            ))}
          </div>
          <SkeletonTable rows={5} cols={5} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <MetricCard
              title="Faturamento Hoje"
              value={formatPrice(metricas.faturamentoDia)}
              icon="💰"
              trend="up"
            />
            <MetricCard
              title="Faturamento Semana"
              value={formatPrice(metricas.faturamentoSemana)}
              icon="📊"
              trend="up"
            />
            <MetricCard
              title="Faturamento Mês"
              value={formatPrice(metricas.faturamentoMes)}
              icon="💸"
              trend="neutral"
            />
            <MetricCard
              title="Ticket Médio"
              value={formatPrice(metricas.ticketMedio)}
              icon="🎯"
              trend="up"
            />
            <MetricCard
              title="Pedidos Pendentes"
              value={metricas.pedidosPendentes}
              icon="📦"
            />
          </div>

          <Card>
            <h2 className="text-xl font-bold text-[#0D2240] mb-4">Últimos Pedidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Cliente</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Total</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((pedido) => (
                    <PedidoRow
                      key={pedido.id}
                      id={pedido.id}
                      cliente_nome={pedido.clientes?.nome || 'Cliente'}
                      total={pedido.total}
                      status={pedido.status}
                      criado_em={pedido.criado_em}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
