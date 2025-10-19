import { NextResponse } from 'next/server'

// Simple middleware for CORS and basic security
export function middleware(request) {
  // Handle OPTIONS requests for CORS preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    
    // Allow requests from preview chat and localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'https://preview-chat-830bbaed-235c-4324-a8fe-778fd4c2e86c.space.z.ai',
      'https://space.z.ai'
    ]
    
    const origin = request.headers.get('origin')
    const allowOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:3000'
    
    response.headers.set('Access-Control-Allow-Origin', allowOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
  }
  
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Allow requests from preview chat and localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'https://preview-chat-830bbaed-235c-4324-a8fe-778fd4c2e86c.space.z.ai',
      'https://space.z.ai'
    ]
    
    const origin = request.headers.get('origin')
    const allowOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:3000'
    
    response.headers.set('Access-Control-Allow-Origin', allowOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // Basic security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}