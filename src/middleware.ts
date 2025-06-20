import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any) {
          cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }: any) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/auth/callback',
    '/auth/auth-code-error',
    '/nutzungsbedingungen',
    '/datenschutz-chat',
    '/haftungsausschluss',
    '/terms',
    '/privacy', 
    '/disclaimer'
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/')
  )
  
  // Skip middleware for all auth routes to prevent interference with OAuth flow
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/')
  if (isAuthRoute) {
    return supabaseResponse
  }

  if (!user && !isPublicRoute) {
    // Allow access to chat routes for potential guest users
    // Guest user verification will happen client-side in the ChatContext
    if (request.nextUrl.pathname.startsWith('/chat')) {
      return supabaseResponse
    }
    
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 