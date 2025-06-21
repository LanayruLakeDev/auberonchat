import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      )
    }

    // Create a redirect response to the chat page
    const { origin } = new URL(request.url)
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    
    let redirectUrl: string
    if (isLocalEnv) {
      redirectUrl = `${origin}/chat`
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}/chat`
    } else {
      redirectUrl = `${origin}/chat`
    }

    // Return success with redirect URL
    return NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    })

  } catch (err) {
    console.error('Email login error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
