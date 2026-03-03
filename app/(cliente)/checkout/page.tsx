'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus } from 'lucide-react'

interface ItemCarrinho {
  id: string
  nome: string
  preco_venda: number
  qtd: number
}

interface Endereco {
  id: string
  apelido: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
}

export default function CheckoutPage() {
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [formaPagamento, setFormaPagamento] = useState('pix')
  const [enderecos, setEnderecos] = useState<Endereco[]>([])
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<string>('')
  const [novoEndereco, setNovoEndereco] = useState('')
  const [usarNovoEndereco, setUsarNovoEndereco] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [sucesso, setSucesso] = useState(false)
  const [taxa, setTaxa] = useState(5)

  useEffect(() => {
    const carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]')
    setItens(carrinho)
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Buscar taxa dinâmica
    const { data: configTaxa } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'taxa_entrega')
      .single()

    if (configTaxa) setTaxa(parseFloat(configTaxa.valor))

    // Buscar endereços salvos
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (clienteData) {
        const { data: endsData } = await supabase
          .from('enderecos')
          .select('id, apelido, logradouro, numero, complemento, bairro')
          .eq('cliente_id', clienteData.id)
          .order('principal', { ascending: false })

        if (endsData && endsData.length > 0) {
          setEnderecos(endsData)
          setEnderecoSelecionado(endsData[0].id)
        } else {
          setUsarNovoEndereco(true)
        }
      }
    } else {
      setUsarNovoEndereco(true)
    }

    setLoadingPage(false)
  }

  const subtotal = itens.reduce((sum, item) => sum + item.preco_venda * item.qtd, 0)
  const total = subtotal + taxa

  const enderecoTexto = usarNovoEndereco
    ? novoEndereco
    : enderecos.find((e) => e.id === enderecoSelecionado)
        ? `${enderecos.find((e) => e.id === enderecoSelecionado)!.logradouro}, ${
            enderecos.find((e) => e.id === enderecoSelecionado)!.numero
          } - ${enderecos.find((e) => e.id === enderecoSelecionado)!.bairro}`
        : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!enderecoTexto.trim()) {
      toast.error('Informe o endereço de entrega')
      return
    }

    if (itens.length === 0) {
      toast.error('Seu carrinho está vazio')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Você precisa estar logado para fazer um pedido')
        setLoading(false)
        return
      }

      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!cliente) {
        toast.error('Perfil de cliente não encontrado')
        setLoading(false)
        return
      }

      // Salvar novo endereço se necessário
      if (usarNovoEndereco && novoEndereco.trim()) {
        const partes = novoEndereco.split(',')
        await supabase.from('enderecos').insert([{
          cliente_id: cliente.id,
          apelido: 'Endereço',
          logradouro: partes[0]?.trim() || novoEndereco,
          numero: partes[1]?.trim() || 's/n',
          bairro: partes[2]?.trim() || '',
          cidade: 'Taubaté',
          estado: 'SP',
        }])
      }

      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert([{
          cliente_id: cliente.id,
          subtotal,
          taxa_entrega: taxa,
          total,
          forma_pagamento: formaPagamento,
          status: 'novo',
          canal: 'pwa',
          observacao: observacao + (enderecoTexto ? `\nEndereço: ${enderecoTexto}` : ''),
        }])
        .select()
        .single()

      if (error) throw error

      // Inserir itens em paralelo
      await Promise.all(
        itens.map((item) =>
          supabase.from('pedidos_itens').insert([{
            pedido_id: pedido.id,
            produto_id: item.id,
            qtd: item.qtd,
            preco_unitario: item.preco_venda,
          }])
        )
      )

      // Fiado automático
      if (formaPagamento === 'fiado') {
        const { data: fiadoExistente } = await supabase
          .from('fiados')
          .select('id, valor_total')
          .eq('cliente_id', cliente.id)
          .eq('status', 'aberto')
          .single()

        if (fiadoExistente) {
          await supabase
            .from('fiados')
            .update({ valor_total: fiadoExistente.valor_total + total })
            .eq('id', fiadoExistente.id)

          await supabase.from('fiados_lancamentos').insert([{
            fiado_id: fiadoExistente.id,
            tipo: 'compra',
            valor: total,
            descricao: `Pedido #${pedido.id.slice(0, 8)}`,
          }])
        } else {
          const { data: novoFiado } = await supabase
            .from('fiados')
            .insert([{
              cliente_id: cliente.id,
              valor_total: total,
              status: 'aberto',
              data_abertura: new Date().toISOString().split('T')[0],
            }])
            .select()
            .single()

          if (novoFiado) {
            await supabase.from('fiados_lancamentos').insert([{
              fiado_id: novoFiado.id,
              tipo: 'compra',
              valor: total,
              descricao: `Pedido #${pedido.id.slice(0, 8)}`,
            }])
          }
        }
      }

      localStorage.removeItem('carrinho')
      setSucesso(true)

      setTimeout(() => {
        window.location.href = `/tracking/${pedido.id}`
      }, 2000)
    } catch (err) {
      console.error('Erro ao criar pedido:', err)
      toast.error('Erro ao criar pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-600">Redirecionando para rastreamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <Link href="/carrinho">
            <button className="text-2xl">←</button>
          </Link>
          <h1 className="text-xl font-bold flex-1 text-center">Checkout</h1>
          <div className="w-6"></div>
        </div>
      </div>

      {loadingPage ? (
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Resumo */}
          <Card>
            <h2 className="font-semibold mb-3">Resumo do Pedido</h2>
            <div className="space-y-1 text-sm mb-3">
              {itens.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.nome} x{item.qtd}</span>
                  <span>{formatPrice(item.preco_venda * item.qtd)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de entrega:</span>
                <span>{formatPrice(taxa)}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total:</span>
                <span className="text-[#0D2240]">{formatPrice(total)}</span>
              </div>
            </div>
          </Card>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-1">
              <MapPin size={14} /> Endereço de Entrega
            </label>

            {enderecos.length > 0 && (
              <div className="space-y-2 mb-3">
                {enderecos.map((end) => (
                  <label
                    key={end.id}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                      !usarNovoEndereco && enderecoSelecionado === end.id
                        ? 'border-[#0D2240] bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="endereco"
                      checked={!usarNovoEndereco && enderecoSelecionado === end.id}
                      onChange={() => {
                        setEnderecoSelecionado(end.id)
                        setUsarNovoEndereco(false)
                      }}
                      className="mr-3 mt-1"
                    />
                    <div>
                      <p className="font-medium text-sm">{end.apelido}</p>
                      <p className="text-xs text-gray-600">
                        {end.logradouro}, {end.numero} — {end.bairro}
                      </p>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    usarNovoEndereco ? 'border-[#0D2240] bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="endereco"
                    checked={usarNovoEndereco}
                    onChange={() => setUsarNovoEndereco(true)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Plus size={14} /> Novo endereço
                  </span>
                </label>
              </div>
            )}

            {(usarNovoEndereco || enderecos.length === 0) && (
              <textarea
                required
                value={novoEndereco}
                onChange={(e) => setNovoEndereco(e.target.value)}
                placeholder="Rua, número, complemento, bairro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
                rows={3}
              />
            )}
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Alguma instrução especial?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D2240]"
              rows={2}
            />
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-sm font-medium mb-2">Forma de Pagamento</label>
            <div className="space-y-2">
              {[
                { id: 'pix', label: '💳 PIX', desc: 'Pagamento instantâneo' },
                { id: 'dinheiro', label: '💵 Dinheiro', desc: 'Na entrega' },
                { id: 'fiado', label: '📝 Fiado', desc: 'Pagar depois — registrado automaticamente' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                    formaPagamento === opt.id ? 'border-[#0D2240] bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pagamento"
                    value={opt.id}
                    checked={formaPagamento === opt.id}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={loading}
            disabled={!enderecoTexto.trim() || itens.length === 0}
          >
            Confirmar Pedido
          </Button>
        </form>
      )}
    </div>
  )
}
