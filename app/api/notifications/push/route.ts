import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@bardacarmen.com.br',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// Envia push notification para um usuário
export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ ok: true, message: 'Sem inscrições push' })
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    })

    const resultados = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Limpar inscrições expiradas (410 Gone)
    const expiradas = subscriptions.filter((_, i) => {
      const r = resultados[i]
      return r.status === 'rejected' && (r.reason as any)?.statusCode === 410
    })

    if (expiradas.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiradas.map((s) => s.endpoint))
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao enviar notificação push:', error)
    return NextResponse.json({ error: 'Erro ao enviar notificação' }, { status: 500 })
  }
}

// Registra nova inscrição push
export async function PUT(request: NextRequest) {
  try {
    const { userId, subscription } = await request.json()

    if (!userId || !subscription?.endpoint) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao registrar inscrição push:', error)
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 })
  }
}
