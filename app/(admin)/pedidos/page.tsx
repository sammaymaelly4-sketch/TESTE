'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { RealtimePedidos } from '@/components/shared/RealtimeProvider'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const statusFlow = ['novo', 'pago', 'em_preparo', 'saiu', 'entregue']
const PAGE_SIZE = 10

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [filtroStatus, setFiltroStatus] = useState('novo')
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchPedidos = useCallback(async (pag = 0) => {
    setLoading(true)
    const supabase = createClient()

    const { data, count } = await supabase
      .from('pedidos')
      .select('*, clientes(nome), pedidos_itens(*, produtos(nome))', { count: 'exact' })
      .eq('status', filtroStatus)
      .order('criado_em', { ascending: false })
      .range(pag * PAGE_SIZE, pag * PAGE_SIZE + PAGE_SIZE - 1)

    setPedidos(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [filtroStatus])

  useEffect(() => {
    setPagina(0)
    fetchPedidos(0)
  }, [filtroStatus])

  const handleStatusChange = async (pedidoId: string) => {
    const supabase = createClient()
    const indexAtual = statusFlow.indexOf(filtroStatus)
    const proximoStatus = statusFlow[indexAtual + 1] || filtroStatus

    const { error } = await supabase
      .from('pedidos')
      .update({ status: proximoStatus })
      .eq('id', pedidoId)

    if (error) {
      toast.error('Erro ao atualizar status do pedido')
      return
    }

    toast.success(`Pedido movido para "${proximoStatus.replace('_', ' ')}"`)
    fetchPedidos(pagina)
  }

  const totalPaginas = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <RealtimePedidos onUpdate={() => fetchPedidos(pagina)} />

      <h1 className="text-3xl font-bold text-[#0D2240] mb-6">Pedidos</h1>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {statusFlow.map((status) => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition ${
              filtroStatus === status
                ? 'bg-[#0D2240] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {total} pedido{total !== 1 ? 's' : ''} com status &ldquo;{filtroStatus.replace('_', ' ')}&rdquo;
      </p>

      {/* Lista de Pedidos */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : pedidos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum pedido com este status</div>
        ) : (
          pedidos.map((pedido) => (
            <Card key={pedido.id}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{pedido.clientes?.nome || 'Cliente'}</h3>
                  <p className="text-xs text-gray-500 font-mono">#{pedido.id.slice(0, 8)}</p>
                </div>
                <Badge variant={
                  pedido.status === 'novo' ? 'warning' :
                  pedido.status === 'entregue' ? 'success' : 'secondary'
                }>
                  {pedido.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="mb-3 space-y-1 text-sm">
                {pedido.pedidos_itens?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.produtos?.nome} × {item.qtd}</span>
                    <span>{formatPrice(item.preco_unitario * item.qtd)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <div>
                  <p className="text-sm text-gray-600">Total:</p>
                  <p className="font-bold text-[#0D2240]">{formatPrice(pedido.total)}</p>
                  <p className="text-xs text-gray-500 uppercase">{pedido.forma_pagamento}</p>
                </div>
                {filtroStatus !== 'entregue' && (
                  <Button size="sm" variant="secondary" onClick={() => handleStatusChange(pedido.id)}>
                    Próximo →
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-2">{formatDateTime(pedido.criado_em)}</p>
            </Card>
          ))
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => { const nova = pagina - 1; setPagina(nova); fetchPedidos(nova) }}
            disabled={pagina === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            Página {pagina + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => { const nova = pagina + 1; setPagina(nova); fetchPedidos(nova) }}
            disabled={pagina >= totalPaginas - 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
