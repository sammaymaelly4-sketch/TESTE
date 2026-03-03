'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { MapPin, Phone, Navigation } from 'lucide-react'

function getMapsUrl(endereco: any) {
  if (!endereco) return null
  const query = encodeURIComponent(
    `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}`
  )
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}

export default function CorridasPage() {
  const [corridas, setCorridas] = useState<any[]>([])
  const [motoboyId, setMotoboyId] = useState<string | null>(null)
  const [status, setStatus] = useState('aguardando')
  const [loading, setLoading] = useState(true)

  const fetchCorridas = useCallback(async (currentStatus: string, mbId?: string) => {
    setLoading(true)
    const supabase = createClient()

    let mbIdToUse = mbId || motoboyId

    if (!mbIdToUse) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: motoboy } = await supabase
        .from('motoboys')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!motoboy) { setLoading(false); return }
      mbIdToUse = motoboy.id
      setMotoboyId(motoboy.id)
    }

    const { data } = await supabase
      .from('corridas')
      .select('*, pedidos(*, clientes(nome, telefone), enderecos(logradouro, numero, bairro, complemento))')
      .eq('motoboy_id', mbIdToUse)
      .eq('status', currentStatus)
      .order('criado_em', { ascending: false })

    setCorridas(data || [])
    setLoading(false)
  }, [motoboyId])

  useEffect(() => {
    fetchCorridas(status)
  }, [status])

  const handleAceitarCorrida = async (corridaId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('corridas')
      .update({ status: 'aceita', aceito_em: new Date().toISOString() })
      .eq('id', corridaId)

    if (error) {
      toast.error('Erro ao aceitar corrida')
      return
    }

    toast.success('Corrida aceita!')
    setCorridas(corridas.filter((c) => c.id !== corridaId))
  }

  const handleIniciarRota = async (corridaId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('corridas')
      .update({ status: 'em_rota' })
      .eq('id', corridaId)

    if (error) {
      toast.error('Erro ao iniciar rota')
      return
    }

    toast.success('Em rota!')
    setCorridas(corridas.filter((c) => c.id !== corridaId))
  }

  const handleFinalizarCorrida = async (corridaId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('corridas')
      .update({ status: 'entregue', entregue_em: new Date().toISOString() })
      .eq('id', corridaId)

    if (error) {
      toast.error('Erro ao finalizar entrega')
      return
    }

    toast.success('Entrega concluída!')
    setCorridas(corridas.filter((c) => c.id !== corridaId))
  }

  const statusLabel: Record<string, string> = {
    aguardando: '🔔 Novas',
    aceita: '✓ Aceitas',
    em_rota: '🚴 Em Rota',
    entregue: '✅ Entregues',
  }

  const badgeVariant: Record<string, any> = {
    aguardando: 'warning',
    aceita: 'info',
    em_rota: 'primary',
    entregue: 'success',
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <h1 className="text-2xl font-bold">🏍️ Minhas Corridas</h1>
      </div>

      {/* Filtros */}
      <div className="p-4 sticky top-16 bg-white border-b">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(statusLabel).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition ${
                status === s
                  ? 'bg-[#0D2240] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : corridas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma corrida com este status
          </div>
        ) : (
          corridas.map((corrida) => {
            const endereco = corrida.pedidos?.enderecos
            const mapsUrl = getMapsUrl(endereco)
            const enderecoTexto = endereco
              ? `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` — ${endereco.complemento}` : ''}, ${endereco.bairro}`
              : 'Endereço não informado'

            return (
              <Card key={corrida.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{corrida.pedidos?.clientes?.nome}</h3>
                    <p className="text-sm text-gray-500">
                      Pedido #{corrida.pedidos?.id?.slice(0, 8)}
                    </p>
                  </div>
                  <Badge variant={badgeVariant[status] || 'secondary'}>
                    {statusLabel[status]}
                  </Badge>
                </div>

                {/* Endereço + Mapa */}
                <div className="flex gap-2 text-sm">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-700">{enderecoTexto}</p>
                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-xs text-[#0D2240] font-medium hover:underline"
                      >
                        <Navigation size={12} />
                        Abrir no Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Distância e Tempo */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    📍 {corrida.distancia_km?.toFixed(1) || '?'} km
                  </span>
                  <span className="text-gray-600">
                    ⏱️ ~{corrida.tempo_estimado_min || '?'} min
                  </span>
                </div>

                {/* Valor + Ações */}
                <div className="flex justify-between items-center border-t pt-3">
                  <p className="font-bold text-[#0D2240]">
                    {formatPrice(corrida.valor_taxa)}
                  </p>

                  <div className="flex gap-2">
                    {status === 'aguardando' && (
                      <>
                        <Button size="sm" variant="danger">
                          × Recusar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAceitarCorrida(corrida.id)}
                        >
                          ✓ Aceitar
                        </Button>
                      </>
                    )}

                    {status === 'aceita' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleIniciarRota(corrida.id)}
                      >
                        🚴 Iniciar Rota
                      </Button>
                    )}

                    {status === 'em_rota' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleFinalizarCorrida(corrida.id)}
                      >
                        ✓ Entregue
                      </Button>
                    )}
                  </div>
                </div>

                {/* Telefone */}
                <div className="flex gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <a
                    href={`tel:${corrida.pedidos?.clientes?.telefone}`}
                    className="text-[#0D2240] hover:underline text-sm"
                  >
                    {corrida.pedidos?.clientes?.telefone}
                  </a>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
