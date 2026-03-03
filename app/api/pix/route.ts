import { NextRequest, NextResponse } from 'next/server'
import { criarCobrancaPix } from '@/lib/mercadopago/pix'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { pedidoId, valor, email } = await request.json()

    if (!pedidoId || !valor || !email) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const pix = await criarCobrancaPix({
      valor,
      descricao: `Pedido Bar da Carmen #${pedidoId.slice(0, 8)}`,
      pedidoId,
      email: email || user.email!,
    })

    if (pix.error) {
      return NextResponse.json(pix, { status: 400 })
    }

    await supabase
      .from('pedidos')
      .update({ pagamento_id: String(pix.id) })
      .eq('id', pedidoId)

    return NextResponse.json(pix)
  } catch (error) {
    console.error('Erro ao criar PIX:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
