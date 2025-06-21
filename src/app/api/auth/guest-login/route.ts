import { NextRequest, NextResponse } from 'next/server'
import { createGuestUser } from '@/lib/localStorage'

export async function POST(request: NextRequest) {
  try {
    const { displayName } = await request.json()
    
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Create guest user object
    const guestUser = createGuestUser(displayName.trim())
    
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

    // Return success with guest user data and redirect URL
    return NextResponse.json({
      success: true,
      redirectUrl,
      guestUser
    })

  } catch (err) {
    console.error('Guest login error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
