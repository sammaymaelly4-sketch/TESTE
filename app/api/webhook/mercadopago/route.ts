import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    })

    const payment = await mpResponse.json()

    if (payment.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const pedidoId = payment.external_reference
    if (!pedidoId) {
      return NextResponse.json({ ok: true })
    }

    // 1. Atualizar status do pedido
    await supabase
      .from('pedidos')
      .update({ status: 'pago', pagamento_status: 'approved', pago_em: new Date().toISOString() })
      .eq('id', pedidoId)

    // 2. Registrar no caixa
    await supabase.from('lancamentos_caixa').insert({
      tipo: 'receita',
      categoria: 'venda',
      valor: payment.transaction_amount,
      origem: `pedido:${pedidoId}`,
      forma_pagamento: 'pix',
      descricao: `Pagamento PIX — pedido #${pedidoId.slice(0, 8)}`,
      data: new Date().toISOString().split('T')[0],
    })

    // 3. Calcular e adicionar pontos de fidelidade
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('cliente_id, total')
      .eq('id', pedidoId)
      .single()

    if (pedido?.cliente_id) {
      // Buscar pontospor real na tabela de configurações
      const { data: configPontos } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'pontos_por_real')
        .single()

      const pontosPorReal = configPontos ? parseFloat(configPontos.valor) : 1
      const pontosGanhos = Math.round((pedido.total || 0) * pontosPorReal)

      await supabase.rpc('incrementar_pontos', {
        p_cliente_id: pedido.cliente_id,
        p_pontos: pontosGanhos,
      }).then(async ({ error }) => {
        // Fallback se a função RPC não existir
        if (error) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('pontos_fidelidade')
            .eq('id', pedido.cliente_id)
            .single()

          if (cliente) {
            await supabase
              .from('clientes')
              .update({ pontos_fidelidade: (cliente.pontos_fidelidade || 0) + pontosGanhos })
              .eq('id', pedido.cliente_id)
          }
        }
      })

      // 4. Enviar push notification ao cliente
      const { data: clienteAuth } = await supabase
        .from('clientes')
        .select('user_id')
        .eq('id', pedido.cliente_id)
        .single()

      if (clienteAuth?.user_id) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: clienteAuth.user_id,
            title: '✅ Pagamento confirmado!',
            body: `Seu pedido #${pedidoId.slice(0, 8)} foi pago e está sendo preparado. Você ganhou ${pontosGanhos} pontos!`,
            url: `/tracking/${pedidoId}`,
          }),
        }).catch(() => null) // Não bloqueia se push falhar
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json({ ok: true })
  }
}
