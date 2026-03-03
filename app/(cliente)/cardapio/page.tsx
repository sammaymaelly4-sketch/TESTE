'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ProdutoCard } from '@/components/cliente/ProdutoCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { Search } from 'lucide-react'

interface Produto {
  id: string
  nome: string
  categoria: string
  preco_venda: number
  foto_url?: string
  descricao?: string
}

function CardapioContent() {
  const searchParams = useSearchParams()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [filteredProdutos, setFilteredProdutos] = useState<Produto[]>([])
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState(searchParams.get('cat') || '')
  const [loading, setLoading] = useState(true)
  const [ordenacao, setOrdenacao] = useState<'nome' | 'preco_asc' | 'preco_desc'>('nome')

  useEffect(() => {
    const fetchProdutos = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)

      setProdutos(data || [])
      setLoading(false)
    }

    fetchProdutos()
  }, [])

  useEffect(() => {
    let filtered = [...produtos]

    if (busca) {
      filtered = filtered.filter((p) =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
      )
    }

    if (categoriaFiltro) {
      filtered = filtered.filter(
        (p) => p.categoria.toLowerCase() === categoriaFiltro.toLowerCase()
      )
    }

    if (ordenacao === 'preco_asc') {
      filtered.sort((a, b) => a.preco_venda - b.preco_venda)
    } else if (ordenacao === 'preco_desc') {
      filtered.sort((a, b) => b.preco_venda - a.preco_venda)
    } else {
      filtered.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }

    setFilteredProdutos(filtered)
  }, [busca, categoriaFiltro, produtos, ordenacao])

  const categorias = ['cerveja', 'drink', 'kit', 'combo', 'outro']

  const handleAddCart = (p: Produto) => {
    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]')
    const existente = carrinho.find((item: any) => item.id === p.id)
    if (existente) {
      existente.qtd += 1
    } else {
      carrinho.push({ ...p, qtd: 1 })
    }
    localStorage.setItem('carrinho', JSON.stringify(carrinho))
    toast.success(`${p.nome} adicionado ao carrinho!`, {
      description: 'Veja seu carrinho para finalizar o pedido.',
    })
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center mb-3">
          <Link href="/">
            <button className="text-2xl">←</button>
          </Link>
          <h1 className="text-xl font-bold flex-1 text-center">Cardápio</h1>
          <div className="w-6"></div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-[#1A3A6B] text-white placeholder-gray-400 text-sm"
          />
        </div>
      </div>

      {/* Filtros de categoria */}
      <div className="px-4 py-3 overflow-x-auto flex gap-2 sticky top-16 bg-white z-30 border-b border-gray-100">
        <button
          onClick={() => setCategoriaFiltro('')}
          className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition ${
            !categoriaFiltro ? 'bg-[#0D2240] text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          Todos
        </button>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaFiltro(cat)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium transition ${
              categoriaFiltro === cat ? 'bg-[#0D2240] text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Ordenação */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <span className="text-xs text-gray-500">Ordenar:</span>
        {[
          { value: 'nome', label: 'A-Z' },
          { value: 'preco_asc', label: 'Menor preço' },
          { value: 'preco_desc', label: 'Maior preço' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setOrdenacao(opt.value as any)}
            className={`text-xs px-2 py-1 rounded-full transition ${
              ordenacao === opt.value
                ? 'bg-[#E6A817] text-[#0D2240] font-semibold'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Produtos */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum produto encontrado</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProdutos.map((produto) => (
              <ProdutoCard key={produto.id} {...produto} onAddCart={handleAddCart} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CardapioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      }
    >
      <CardapioContent />
    </Suspense>
  )
}
