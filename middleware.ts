import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ADMIN_ROUTES = ['/dashboard', '/pedidos', '/estoque', '/caixa', '/fiado', '/ocr']
const MOTOBOY_ROUTES = ['/corridas']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isMotoRoute = MOTOBOY_ROUTES.some((r) => pathname.startsWith(r))

  if (!isAdminRoute && !isMotoRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options } as any)
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options } as any)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options } as any)
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options } as any)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute) {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url))
    }
  }

  if (isMotoRoute) {
    const { data: motoboy } = await supabase
      .from('motoboys')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!motoboy) {
      return NextResponse.redirect(new URL('/acesso-negado', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/pedidos/:path*',
    '/estoque/:path*',
    '/caixa/:path*',
    '/fiado/:path*',
    '/ocr/:path*',
    '/corridas/:path*',
  ],
}
