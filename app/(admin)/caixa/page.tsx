'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { formatPrice, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Download, Calendar } from 'lucide-react'

function exportarCSV(lancamentos: any[], data: string) {
  const header = 'Data,Tipo,Categoria,Descrição,Forma de Pagamento,Valor'
  const linhas = lancamentos.map((l) =>
    [data, l.tipo, l.categoria, `"${(l.descricao || '').replace(/"/g, '""')}"`, l.forma_pagamento, l.valor].join(',')
  )
  const csv = [header, ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `caixa-${data}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CaixaPage() {
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [resumo, setResumo] = useState({ receitas: 0, despesas: 0, saldo: 0 })
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0])
  const [formData, setFormData] = useState({
    tipo: 'receita',
    categoria: '',
    valor: '',
    descricao: '',
    forma_pagamento: 'pix',
  })

  const fetchLancamentos = async (data = dataFiltro) => {
    setLoading(true)
    const supabase = createClient()

    const { data: result } = await supabase
      .from('lancamentos_caixa')
      .select('*')
      .eq('data', data)
      .order('criado_em', { ascending: false })

    setLancamentos(result || [])

    const receitas = result?.filter((l: any) => l.tipo === 'receita').reduce((sum: number, l: any) => sum + (l.valor || 0), 0) || 0
    const despesas = result?.filter((l: any) => l.tipo === 'despesa').reduce((sum: number, l: any) => sum + (l.valor || 0), 0) || 0

    setResumo({ receitas, despesas, saldo: receitas - despesas })
    setLoading(false)
  }

  useEffect(() => {
    fetchLancamentos(dataFiltro)
  }, [dataFiltro])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient()
    const { error } = await supabase.from('lancamentos_caixa').insert([{
      tipo: formData.tipo,
      categoria: formData.categoria,
      valor: parseFloat(formData.valor),
      descricao: formData.descricao,
      forma_pagamento: formData.forma_pagamento,
      data: dataFiltro,
    }])

    if (error) {
      toast.error('Erro ao registrar lançamento')
      return
    }

    toast.success('Lançamento registrado!')
    setFormData({ tipo: 'receita', categoria: '', valor: '', descricao: '', forma_pagamento: 'pix' })
    setIsOpen(false)
    fetchLancamentos(dataFiltro)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D2240]">Caixa Diário</h1>
        <button
          onClick={() => exportarCSV(lancamentos, dataFiltro)}
          disabled={lancamentos.length === 0}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0D2240] border border-gray-300 rounded-lg px-3 py-2 transition disabled:opacity-40"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Seletor de data */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar size={18} className="text-gray-500" />
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240] text-sm"
        />
        <span className="text-sm text-gray-500">{formatDate(dataFiltro)}</span>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600">Receitas</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(resumo.receitas)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Despesas</p>
          <p className="text-2xl font-bold text-red-600">{formatPrice(resumo.despesas)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Saldo</p>
          <p className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPrice(resumo.saldo)}
          </p>
        </Card>
      </div>

      {/* Botão Novo Lançamento */}
      <div className="mb-6">
        <Button size="lg" variant="primary" onClick={() => setIsOpen(true)} className="w-full">
          + Novo Lançamento
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Lançamentos de {formatDate(dataFiltro)}</h2>
        {loading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : lancamentos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum lançamento nesta data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-semibold">Categoria</th>
                  <th className="px-4 py-2 text-left font-semibold">Descrição</th>
                  <th className="px-4 py-2 text-center font-semibold">Forma</th>
                  <th className="px-4 py-2 text-right font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((lanc) => (
                  <tr key={lanc.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{lanc.categoria}</td>
                    <td className="px-4 py-3 text-gray-600">{lanc.descricao}</td>
                    <td className="px-4 py-3 text-center text-sm uppercase">{lanc.forma_pagamento}</td>
                    <td className={`px-4 py-3 text-right font-bold ${lanc.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                      {lanc.tipo === 'receita' ? '+' : '−'} {formatPrice(lanc.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-bold">Saldo do dia</td>
                  <td className={`px-4 py-3 text-right font-bold text-lg ${resumo.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPrice(resumo.saldo)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Novo Lançamento */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Novo Lançamento" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <div className="flex gap-2">
              {[
                { value: 'receita', label: '📈 Receita' },
                { value: 'despesa', label: '📉 Despesa' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: opt.value })}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                    formData.tipo === opt.value ? 'bg-[#0D2240] text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <input
              type="text"
              required
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              placeholder="Ex: Venda, Aluguel, Material..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Forma de Pagamento</label>
            <select
              value={formData.forma_pagamento}
              onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
            >
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
            />
          </div>

          <Button type="submit" size="lg" variant="primary" className="w-full">
            Registrar Lançamento
          </Button>
        </form>
      </Modal>
    </div>
  )
}
