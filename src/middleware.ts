import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/auth/callback',
      '/auth/auth-code-error',
      '/nutzungsbedingungen',
      '/datenschutz-chat',
      '/haftungsausschluss'
    ]
    
    const isPublicRoute = publicRoutes.some(route => 
      req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
    )
    
    // Skip middleware for all auth routes to prevent interference with OAuth flow
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth/')
    if (isAuthRoute) {
      return NextResponse.next()
    }

    // If user is authenticated and trying to access login or home, redirect to chat
    if (req.nextauth.token && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname === '/')) {
      const url = req.nextUrl.clone()
      url.pathname = '/chat'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/auth/callback',
          '/auth/auth-code-error',
          '/nutzungsbedingungen',
          '/datenschutz-chat',
          '/haftungsausschluss'
        ]
        
        const isPublicRoute = publicRoutes.some(route => 
          req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(route + '/')
        )
        
        // Skip middleware for all auth routes
        const isAuthRoute = req.nextUrl.pathname.startsWith('/auth/')
        if (isAuthRoute) {
          return true
        }

        // Allow access to public routes without auth
        if (isPublicRoute) {
          return true
        }

        // Require authentication for all other routes
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
