'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function FidelidadePage() {
  const [cliente, setCliente] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCliente = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setCliente(data)
      }

      setLoading(false)
    }

    fetchCliente()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Você precisa estar logado</p>
          <Link href="/">
            <Button variant="primary">Voltar</Button>
          </Link>
        </div>
      </div>
    )
  }

  const nivelFidelidade = Math.floor((cliente.pontos_fidelidade || 0) / 100)
  const pontosProxNivel = 100 - ((cliente.pontos_fidelidade || 0) % 100)

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#0D2240] text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <Link href="/">
            <button className="text-2xl">←</button>
          </Link>
          <h1 className="text-xl font-bold flex-1 text-center">Programa de Fidelidade</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cartão de Pontos */}
        <div className="bg-gradient-to-br from-[#0D2240] to-[#1A3A6B] text-white rounded-lg p-6 text-center">
          <p className="text-sm opacity-90">Seus Pontos</p>
          <p className="text-5xl font-bold my-2">{cliente.pontos_fidelidade || 0}</p>
          <p className="text-xs opacity-75">⭐ Nível {nivelFidelidade}</p>
        </div>

        {/* Progresso */}
        <Card>
          <h3 className="font-semibold mb-2">Próximo Nível</h3>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{(cliente.pontos_fidelidade || 0) % 100} / 100</span>
              <span>{pontosProxNivel} para o próximo</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#E6A817] h-2 rounded-full transition-all"
                style={{ width: `${((cliente.pontos_fidelidade || 0) % 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Benefícios */}
        <Card>
          <h3 className="font-semibold mb-3">Benefícios</h3>
          <div className="space-y-3">
            {[
              { nivel: 'Bronze', pontos: '0-99', bonus: '2% desconto' },
              { nivel: 'Prata', pontos: '100-299', bonus: '5% desconto + bebida grátis' },
              { nivel: 'Ouro', pontos: '300+', bonus: '10% desconto + comanda liberada' },
            ].map((benefit) => (
              <div
                key={benefit.nivel}
                className={`p-3 rounded-lg border-2 ${
                  nivelFidelidade >= parseInt(benefit.pontos.split('-')[0]) / 100
                    ? 'border-[#E6A817] bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{benefit.nivel}</p>
                    <p className="text-xs text-gray-600">{benefit.pontos} pontos</p>
                  </div>
                  <p className="text-sm font-bold text-[#0D2240]">{benefit.bonus}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Como Funciona */}
        <Card>
          <h3 className="font-semibold mb-3">Como Funciona</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>💰 Ganhe 1 ponto para cada real gasto</p>
            <p>🎯 Acumule pontos e suba de nível</p>
            <p>🎁 Desbloqueie benefícios exclusivos</p>
            <p>🎊 Aproveite descontos em seus pedidos</p>
          </div>
        </Card>

        <Link href="/">
          <Button size="lg" variant="primary" className="w-full">
            Voltar para Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
