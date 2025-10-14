import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This call automatically refreshes expired tokens and updates cookies
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  // Log session status for debugging
  if (error) {
    console.log('Middleware: Session error:', error.message)
  } else if (user) {
    console.log('Middleware: Valid session for user:', user.id)
  } else {
    console.log('Middleware: No user session')
  }

  return response
}