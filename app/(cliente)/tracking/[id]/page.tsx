'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDateTime } from '@/lib/utils'

const statusFlow = ['novo', 'pago', 'em_preparo', 'saiu', 'entregue']
const statusLabels = {
  novo: '📦 Novo',
  pago: '✅ Pago',
  em_preparo: '👨‍🍳 Em Preparo',
  saiu: '🏍️ Saiu para Entrega',
  entregue: '✨ Entregue',
}

export default function TrackingPage({ params }: { params: { id: string } }) {
  const [pedido, setPedido] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPedido = async () => {
      const supabase = createClient()
      const { data: pedidoData } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', params.id)
        .single()

      const { data: itensData } = await supabase
        .from('pedidos_itens')
        .select('*, produtos(nome, categoria)')
        .eq('pedido_id', params.id)

      setPedido(pedidoData)
      setItens(itensData || [])
      setLoading(false)

      // Realtime subscription
      const channel = supabase
        .channel(`pedido:${params.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${params.id}` }, (payload) => {
          setPedido(payload.new)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    fetchPedido()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Pedido não encontrado</p>
          <Link href="/">
            <Button variant="primary">Voltar para Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStatusIndex = statusFlow.indexOf(pedido.status)

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="text-2xl">←</button>
          </Link>
          <h1 className="text-xl font-bold flex-1 text-center">Rastreamento</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Timeline */}
        <Card>
          <h2 className="font-semibold mb-4">Status do Pedido</h2>
          <div className="space-y-4">
            {statusFlow.map((status, idx) => (
              <div key={status} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx <= currentStatusIndex
                        ? 'bg-[#0D2240] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < statusFlow.length - 1 && (
                    <div
                      className={`w-1 h-8 ${
                        idx < currentStatusIndex ? 'bg-[#0D2240]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={`font-medium ${
                      idx <= currentStatusIndex ? 'text-[#0D2240]' : 'text-gray-400'
                    }`}
                  >
                    {statusLabels[status as keyof typeof statusLabels]}
                  </p>
                  {idx === currentStatusIndex && (
                    <p className="text-xs text-gray-500">Agora</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detalhes */}
        <Card>
          <h3 className="font-semibold mb-3">Detalhes do Pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Número:</span>
              <span className="font-mono">{pedido.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Criado em:</span>
              <span>{formatDateTime(pedido.criado_em)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forma de Pagamento:</span>
              <Badge variant="secondary" className="text-xs capitalize">
                {pedido.forma_pagamento}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Itens */}
        <Card>
          <h3 className="font-semibold mb-3">Itens</h3>
          <div className="space-y-2">
            {itens.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.produtos.nome} x{item.qtd}</span>
                <span>{formatPrice(item.preco_unitario * item.qtd)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-[#0D2240]">{formatPrice(pedido.total)}</span>
            </div>
          </div>
        </Card>

        {/* Observação */}
        {pedido.observacao && (
          <Card>
            <h3 className="font-semibold mb-2">Observações</h3>
            <p className="text-sm text-gray-600">{pedido.observacao}</p>
          </Card>
        )}

        {/* Botões */}
        <Link href="/">
          <Button size="lg" variant="primary" className="w-full">
            Continuar Comprando
          </Button>
        </Link>
      </div>
    </div>
  )
}
