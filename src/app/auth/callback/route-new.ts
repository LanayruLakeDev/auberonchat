import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // This route is no longer needed with NextAuth, which handles OAuth redirects internally
  // We'll redirect to the main auth page instead
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`) 
}
