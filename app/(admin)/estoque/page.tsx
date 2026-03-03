'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EstoqueAlerta } from '@/components/admin/EstoqueAlerta'
import { RealtimeEstoque } from '@/components/shared/RealtimeProvider'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProdutoEstoque {
  id: string
  nome: string
  categoria: string
  estoque_minimo: number
  qtd_atual: number
  lotes: any[]
}

const PAGE_SIZE = 15

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([])
  const [filtrados, setFiltrados] = useState<ProdutoEstoque[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [paginaAtual, setPaginaAtual] = useState(0)

  const fetchEstoque = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('produtos')
      .select('*, lotes(id, qtd_atual, qtd_inicial, validade, custo_unitario)')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    const comEstoque = data?.map((p: any) => ({
      ...p,
      qtd_atual: p.lotes?.reduce((sum: number, l: any) => sum + (l.qtd_atual || 0), 0) || 0,
    })) || []

    setProdutos(comEstoque)
    setLoading(false)
  }

  useEffect(() => {
    fetchEstoque()
  }, [])

  useEffect(() => {
    let filtered = [...produtos]

    if (busca) {
      filtered = filtered.filter(
        (p) =>
          p.nome.toLowerCase().includes(busca.toLowerCase()) ||
          p.categoria.toLowerCase().includes(busca.toLowerCase())
      )
    }

    if (filtroStatus === 'alerta') {
      filtered = filtered.filter((p) => p.qtd_atual <= p.estoque_minimo)
    } else if (filtroStatus === 'critico') {
      filtered = filtered.filter((p) => p.qtd_atual > 0 && p.qtd_atual < p.estoque_minimo / 2)
    } else if (filtroStatus === 'esgotado') {
      filtered = filtered.filter((p) => p.qtd_atual <= 0)
    }

    setFiltrados(filtered)
    setPaginaAtual(0)
  }, [busca, filtroStatus, produtos])

  const alertas = produtos.filter((p) => p.qtd_atual <= p.estoque_minimo)
  const criticos = produtos.filter((p) => p.qtd_atual < p.estoque_minimo / 2)
  const totalPaginas = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginados = filtrados.slice(paginaAtual * PAGE_SIZE, (paginaAtual + 1) * PAGE_SIZE)

  return (
    <div>
      <RealtimeEstoque onUpdate={fetchEstoque} />

      <h1 className="text-3xl font-bold text-[#0D2240] mb-6">Estoque</h1>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600">Total de Produtos</p>
          <p className="text-2xl font-bold text-[#0D2240]">{produtos.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Em Alerta</p>
          <p className="text-2xl font-bold text-yellow-600">{alertas.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Críticos</p>
          <p className="text-2xl font-bold text-red-600">{criticos.length}</p>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {criticos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-[#0D2240]">⚠️ Alertas Críticos</h2>
          <div className="space-y-2">
            {criticos.map((p) => (
              <EstoqueAlerta
                key={p.id}
                produto_nome={p.nome}
                qtd_atual={p.qtd_atual}
                estoque_minimo={p.estoque_minimo}
                urgente={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Busca e Filtros */}
      <div className="mb-4 flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'Todos' },
            { value: 'alerta', label: '⚠️ Alerta' },
            { value: 'critico', label: '🔴 Crítico' },
            { value: 'esgotado', label: '❌ Esgotado' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filtroStatus === f.value
                  ? 'bg-[#0D2240] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-3">{filtrados.length} produtos encontrados</p>

      {/* Tabela de Produtos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left font-semibold">Produto</th>
                <th className="px-4 py-2 text-left font-semibold">Categoria</th>
                <th className="px-4 py-2 text-center font-semibold">Qtd Atual</th>
                <th className="px-4 py-2 text-center font-semibold">Mínimo</th>
                <th className="px-4 py-2 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4">
                    <SkeletonTable rows={6} cols={5} />
                  </td>
                </tr>
              ) : paginados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                paginados.map((produto) => {
                  const status =
                    produto.qtd_atual <= 0 ? 'esgotado' :
                    produto.qtd_atual < produto.estoque_minimo / 2 ? 'crítico' :
                    produto.qtd_atual <= produto.estoque_minimo ? 'baixo' : 'ok'

                  return (
                    <tr key={produto.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{produto.nome}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{produto.categoria}</td>
                      <td className="px-4 py-3 text-center font-bold">{produto.qtd_atual}</td>
                      <td className="px-4 py-3 text-center">{produto.estoque_minimo}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            status === 'esgotado' || status === 'crítico' ? 'danger' :
                            status === 'baixo' ? 'warning' : 'success'
                          }
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPaginaAtual((p) => p - 1)}
            disabled={paginaAtual === 0}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            Página {paginaAtual + 1} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaAtual((p) => p + 1)}
            disabled={paginaAtual >= totalPaginas - 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
