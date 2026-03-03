'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'

interface Produto {
  id: string
  nome: string
  categoria: string
  preco_venda: number
}

export default function HomePage() {
  const [cliente, setCliente] = useState<any>(null)
  const [produtosPopulares, setProdutosPopulares] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [qtdCarrinho, setQtdCarrinho] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setCliente(clienteData)
      }

      const { data: produtos } = await supabase
        .from('produtos')
        .select('id, nome, categoria, preco_venda')
        .eq('ativo', true)
        .limit(8)

      setProdutosPopulares(produtos || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  // Lê contagem do carrinho do localStorage
  useEffect(() => {
    const lerCarrinho = () => {
      try {
        const raw = localStorage.getItem('carrinho')
        if (!raw) { setQtdCarrinho(0); return }
        const itens: any[] = JSON.parse(raw)
        const total = itens.reduce((sum, item) => sum + (item.qtd || item.quantidade || 1), 0)
        setQtdCarrinho(total)
      } catch {
        setQtdCarrinho(0)
      }
    }

    lerCarrinho()

    // Atualiza quando o storage muda (ex: ao voltar do carrinho)
    window.addEventListener('storage', lerCarrinho)
    return () => window.removeEventListener('storage', lerCarrinho)
  }, [])

  const categorias = [
    { nome: 'Cervejas', icon: '🍺', color: 'bg-blue-100' },
    { nome: 'Drinks', icon: '🍹', color: 'bg-pink-100' },
    { nome: 'Kits', icon: '📦', color: 'bg-purple-100' },
    { nome: 'Combos', icon: '🎁', color: 'bg-yellow-100' },
  ]

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-display font-bold">🍺 Bar da Carmen</h1>
          <Link href="/carrinho">
            <button className="relative">
              <ShoppingCart size={24} />
              {qtdCarrinho > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E6A817] text-[#0D2240] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {qtdCarrinho > 9 ? '9+' : qtdCarrinho}
                </span>
              )}
            </button>
          </Link>
        </div>

        {cliente && (
          <p className="text-sm text-[#E6A817]">
            Olá, {cliente.nome}! 👋
          </p>
        )}
      </div>

      {/* Promoção Banner */}
      <div className="bg-gradient-to-r from-[#E6A817] to-[#F5C842] p-4 m-4 rounded-lg">
        <p className="text-[#0D2240] font-bold text-sm">
          🎉 Gaste R$ 100 e ganhe 10% de desconto!
        </p>
        <p className="text-[#0D2240] text-xs mt-1">Use o código: CARMEN10</p>
      </div>

      {/* Categorias */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-[#0D2240] mb-3">Categorias</h2>
        <div className="grid grid-cols-4 gap-2">
          {categorias.map((cat) => (
            <Link key={cat.nome} href={`/cardapio?cat=${cat.nome.toLowerCase()}`}>
              <div className={`${cat.color} rounded-lg p-3 text-center cursor-pointer hover:opacity-80 transition`}>
                <p className="text-2xl mb-1">{cat.icon}</p>
                <p className="text-xs font-medium text-[#0D2240]">{cat.nome}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mais Pedidos */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-[#0D2240] mb-3">Mais Pedidos</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produtosPopulares.map((produto) => (
              <Link key={produto.id} href={`/cardapio?id=${produto.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition h-full">
                  <div className="bg-gray-200 h-24 rounded mb-2 flex items-center justify-center text-3xl">
                    🍺
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2">{produto.nome}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {produto.categoria}
                    </Badge>
                    <span className="font-bold text-[#0D2240]">
                      {formatPrice(produto.preco_venda)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
        <div className="flex justify-around">
          <Link href="/" className="flex-1 py-3 text-center border-b-2 border-[#E6A817]">
            <p className="text-2xl">🏠</p>
            <p className="text-xs font-medium text-[#0D2240]">Home</p>
          </Link>
          <Link href="/cardapio" className="flex-1 py-3 text-center hover:bg-gray-50">
            <p className="text-2xl">📖</p>
            <p className="text-xs font-medium text-gray-600">Cardápio</p>
          </Link>
          <Link href="/carrinho" className="relative flex-1 py-3 text-center hover:bg-gray-50">
            <p className="text-2xl">🛒</p>
            {qtdCarrinho > 0 && (
              <span className="absolute top-2 right-6 bg-[#E6A817] text-[#0D2240] rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {qtdCarrinho > 9 ? '9+' : qtdCarrinho}
              </span>
            )}
            <p className="text-xs font-medium text-gray-600">Carrinho</p>
          </Link>
          <Link href="/fidelidade" className="flex-1 py-3 text-center hover:bg-gray-50">
            <p className="text-2xl">⭐</p>
            <p className="text-xs font-medium text-gray-600">Pontos</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
