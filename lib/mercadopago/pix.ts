export async function criarCobrancaPix(params: {
  valor: number
  descricao: string
  pedidoId: string
  email: string
}) {
  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: params.valor,
        description: params.descricao,
        payment_method_id: 'pix',
        payer: { email: params.email },
        external_reference: params.pedidoId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/mercadopago`,
      }),
    })

    const data = await response.json()

    return {
      id: data.id,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      status: data.status,
      error: !response.ok ? data.message : null,
    }
  } catch (error) {
    console.error('Erro ao criar cobrança PIX:', error)
    return { error: 'Falha ao criar cobrança' }
  }
}
