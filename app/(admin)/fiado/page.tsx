'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatPrice, formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'

function exportarFiadoCSV(fiados: any[]) {
  const header = 'Cliente,Telefone,Status,Desde,Vencimento,Deve'
  const linhas = fiados.map((f) =>
    [
      `"${(f.clientes?.nome || '').replace(/"/g, '""')}"`,
      f.clientes?.telefone || '',
      f.status,
      f.data_abertura,
      f.data_vencimento || '',
      f.valor_total,
    ].join(',')
  )
  const csv = [header, ...linhas].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiado-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function FiadoPage() {
  const [fiados, setFiados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFiado, setSelectedFiado] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [novoLancamento, setNovoLancamento] = useState({
    tipo: 'compra',
    valor: '',
    descricao: '',
  })

  const fetchFiados = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('fiados')
      .select('*, clientes(nome, telefone), fiados_lancamentos(id, tipo, valor, descricao, criado_em)')
      .order('data_abertura', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar fiados')
    }

    setFiados(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFiados()
  }, [])

  const handleOpenModal = (fiado: any) => {
    setSelectedFiado(fiado)
    setNovoLancamento({ tipo: 'compra', valor: '', descricao: '' })
    setIsOpen(true)
  }

  const handleAddLancamento = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const supabase = createClient()
    const valor = parseFloat(novoLancamento.valor)

    const { error: insertError } = await supabase.from('fiados_lancamentos').insert([
      {
        fiado_id: selectedFiado.id,
        tipo: novoLancamento.tipo,
        valor,
        descricao: novoLancamento.descricao,
      },
    ])

    if (insertError) {
      toast.error('Erro ao registrar lançamento')
      setSubmitting(false)
      return
    }

    const novoTotal = selectedFiado.valor_total + (novoLancamento.tipo === 'compra' ? valor : -valor)

    const { error: updateError } = await supabase
      .from('fiados')
      .update({
        valor_total: novoTotal,
        status: novoTotal <= 0 ? 'quitado' : 'aberto',
      })
      .eq('id', selectedFiado.id)

    if (updateError) {
      toast.error('Erro ao atualizar saldo')
      setSubmitting(false)
      return
    }

    toast.success(
      novoLancamento.tipo === 'pagamento'
        ? `Pagamento de ${formatPrice(valor)} registrado!`
        : `Compra de ${formatPrice(valor)} adicionada ao fiado`
    )

    setNovoLancamento({ tipo: 'compra', valor: '', descricao: '' })
    setIsOpen(false)
    setSubmitting(false)
    fetchFiados()
  }

  const totalFiado = fiados.filter((f) => f.status === 'aberto').reduce((sum, f) => sum + (f.valor_total || 0), 0)
  const devedores = fiados.filter((f) => f.status === 'aberto').length

  const isVencido = (fiado: any) => {
    if (!fiado.data_vencimento) return false
    return new Date(fiado.data_vencimento) < new Date() && fiado.status === 'aberto'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D2240]">Fiado</h1>
        <button
          onClick={() => exportarFiadoCSV(fiados)}
          disabled={fiados.length === 0}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0D2240] border border-gray-300 rounded-lg px-3 py-2 transition disabled:opacity-40"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-sm text-gray-600">Total em Fiado</p>
          <p className="text-2xl font-bold text-red-600">{formatPrice(totalFiado)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Devedores Ativos</p>
          <p className="text-2xl font-bold text-[#0D2240]">{devedores}</p>
        </Card>
      </div>

      {/* Lista de Fiados */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Devedores</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : fiados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum fiado registrado</div>
        ) : (
          <div className="space-y-3">
            {fiados.map((fiado) => (
              <div
                key={fiado.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{fiado.clientes?.nome}</p>
                    <p className="text-xs text-gray-500">{fiado.clientes?.telefone}</p>
                  </div>
                  <Badge
                    variant={
                      isVencido(fiado) ? 'danger' : fiado.status === 'aberto' ? 'warning' : 'success'
                    }
                  >
                    {isVencido(fiado) ? 'vencido' : fiado.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-gray-600">Desde: {formatDate(fiado.data_abertura)}</p>
                    {fiado.data_vencimento && (
                      <p className={`text-xs ${isVencido(fiado) ? 'text-red-600 font-semibold' : 'text-red-400'}`}>
                        Vence: {formatDate(fiado.data_vencimento)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Deve:</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatPrice(Math.max(0, fiado.valor_total))}
                    </p>
                  </div>
                </div>

                {fiado.status === 'aberto' && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenModal(fiado)}
                      className="w-full"
                    >
                      Registrar Lançamento
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Fiado — ${selectedFiado?.clientes?.nome}`}
        size="md"
      >
        {selectedFiado && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600">Saldo atual</p>
              <p className="text-2xl font-bold text-red-600">
                {formatPrice(Math.max(0, selectedFiado.valor_total))}
              </p>
            </div>

            <form onSubmit={handleAddLancamento} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <div className="flex gap-2">
                  {[
                    { value: 'compra', label: '➕ Nova Compra' },
                    { value: 'pagamento', label: '✅ Pagamento' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setNovoLancamento({ ...novoLancamento, tipo: opt.value })
                      }
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${
                        novoLancamento.tipo === opt.value
                          ? 'bg-[#0D2240] text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={novoLancamento.valor}
                  onChange={(e) =>
                    setNovoLancamento({ ...novoLancamento, valor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <input
                  type="text"
                  value={novoLancamento.descricao}
                  onChange={(e) =>
                    setNovoLancamento({ ...novoLancamento, descricao: e.target.value })
                  }
                  placeholder="Ex: 2 cervejas, pagamento parcial..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
                />
              </div>

              <Button type="submit" size="lg" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Registrando...' : 'Registrar'}
              </Button>
            </form>

            {selectedFiado.fiados_lancamentos && selectedFiado.fiados_lancamentos.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Histórico</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...selectedFiado.fiados_lancamentos]
                    .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
                    .map((lanc: any) => (
                      <div key={lanc.id} className="flex justify-between items-start text-sm py-1 border-b last:border-0">
                        <div>
                          <span className={lanc.tipo === 'compra' ? 'text-red-600' : 'text-green-600'}>
                            {lanc.tipo === 'compra' ? '➕' : '✅'} {lanc.tipo}
                          </span>
                          {lanc.descricao && (
                            <p className="text-xs text-gray-500 mt-0.5">{lanc.descricao}</p>
                          )}
                        </div>
                        <span className={`font-medium ${lanc.tipo === 'compra' ? 'text-red-600' : 'text-green-600'}`}>
                          {lanc.tipo === 'compra' ? '+' : '−'} {formatPrice(lanc.valor)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
