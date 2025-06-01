import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Set the cookie on the request for other server components
          req.cookies.set({ name, value, ...options })
          // Set the cookie on the response for the browser
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          // Remove the cookie from the request
          req.cookies.set({ name, value: '', ...options })
          // Remove the cookie from the response
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { pathname } = req.nextUrl

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Define route categories
    const protectedRoutes = ['/dashboard', '/admin', '/books/borrow', '/auth-redirector']
    const adminRoutes = ['/admin']
    const authRoutes = ['/login', '/register']
    const publicRoutes = ['/', '/books']

    // Check route types
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))

    // If accessing auth pages while authenticated, redirect to auth-redirector
    if (isAuthRoute && session) {
      const redirectUrl = new URL('/auth-redirector', req.url)
      const redirectTo = req.nextUrl.searchParams.get('redirectTo')
      if (redirectTo) {
        redirectUrl.searchParams.set('redirectTo', redirectTo)
      }
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing protected routes without authentication, redirect to login
    if (isProtectedRoute && !session) {
      const loginUrl = new URL('/login', req.url)
      // Preserve the intended destination
      if (pathname !== '/auth-redirector') {
        loginUrl.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }

    // For admin routes, we'll let the component handle role verification
    // since we need to query the database for user roles
    
    return response

  } catch (error) {
    // If there's an error with auth, redirect to login for protected routes
    console.error('Middleware auth error:', error)
    
    const isProtectedRoute = ['/dashboard', '/admin', '/books/borrow', '/auth-redirector']
      .some(route => pathname.startsWith(route))
    
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', req.url)
      if (pathname !== '/auth-redirector') {
        loginUrl.searchParams.set('redirectTo', pathname)
      }
      return NextResponse.redirect(loginUrl)
    }
      return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
