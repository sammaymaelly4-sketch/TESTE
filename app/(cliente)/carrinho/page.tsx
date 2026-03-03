'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils'
import { useCarrinho } from '@/lib/hooks/useCarrinho'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function CarrinhoPage() {
  const { itens, loading, atualizarQtd, removerItem } = useCarrinho()
  const [taxa, setTaxa] = useState(5)

  useEffect(() => {
    const fetchTaxa = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'taxa_entrega')
        .single()
      if (data) setTaxa(parseFloat(data.valor))
    }
    fetchTaxa()
  }, [])

  const subtotal = itens.reduce((sum, item) => sum + item.preco_venda * item.qtd, 0)
  const total = subtotal + taxa

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="text-2xl">←</button>
          </Link>
          <h1 className="text-xl font-bold flex-1 text-center">Carrinho</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {/* Itens */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🛒</p>
            <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
            <Link href="/cardapio">
              <Button variant="primary" size="md">Ver Cardápio</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map((item) => (
              <Card key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium">{item.nome}</h3>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.preco_venda)} × {item.qtd} ={' '}
                    <span className="font-semibold text-[#0D2240]">
                      {formatPrice(item.preco_venda * item.qtd)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      onClick={() => atualizarQtd(item.id, item.qtd - 1)}
                      className="px-2 py-1 hover:bg-gray-100 transition"
                    >
                      −
                    </button>
                    <span className="px-3 py-1 font-medium">{item.qtd}</span>
                    <button
                      onClick={() => atualizarQtd(item.id, item.qtd + 1)}
                      className="px-2 py-1 hover:bg-gray-100 transition"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removerItem(item.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Resumo fixo */}
      {itens.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto shadow-lg">
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Taxa de entrega:</span>
              <span>{formatPrice(taxa)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-[#0D2240]">{formatPrice(total)}</span>
            </div>
            <Link href="/checkout">
              <Button size="lg" variant="primary" className="w-full">
                Ir para Checkout
              </Button>
            </Link>
            <Link href="/cardapio">
              <Button size="lg" variant="ghost" className="w-full">
                Continuar Comprando
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
