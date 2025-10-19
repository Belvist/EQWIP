import { NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { NextRequest } from 'next/server'

// Rate limiting configuration
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
}

// Store for rate limiting (in production, use Redis or similar)
const ipRequests = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = ipRequests.get(ip)
  
  if (!record || now > record.resetTime) {
    // New window or expired
    ipRequests.set(ip, {
      count: 1,
      resetTime: now + rateLimit.windowMs
    })
    return false
  }
  
  if (record.count >= rateLimit.max) {
    return true
  }
  
  record.count++
  return false
}

// Security headers
const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

export default withAuth(
  function middleware(req: NextRequest) {
    // Handle OPTIONS requests for CORS preflight
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      
      // Разрешаем запросы от превью чата и локального хоста
      const allowedOrigins = [
        'http://localhost:3000',
        'https://preview-chat-830bbaed-235c-4324-a8fe-778fd4c2e86c.space.z.ai',
        'https://space.z.ai'
      ]
      
      const origin = req.headers.get('origin')
      const allowOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:3000'
      
      response.headers.set('Access-Control-Allow-Origin', allowOrigin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      
      return response
    }
    
    // Get client IP
    const ip = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    // Apply rate limiting
    if (isRateLimited(ip)) {
      return new NextResponse(JSON.stringify({ error: rateLimit.message }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.windowMs.toString(),
        },
      })
    }
    
    // Add security headers
    const response = NextResponse.next()
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Разрешаем запросы от превью чата и локального хоста
      const allowedOrigins = [
        'http://localhost:3000',
        'https://preview-chat-830bbaed-235c-4324-a8fe-778fd4c2e86c.space.z.ai',
        'https://space.z.ai'
      ]
      
      const origin = req.headers.get('origin')
      const allowOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:3000'
      
      response.headers.set('Access-Control-Allow-Origin', allowOrigin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/auth/signin',
          '/auth/signup',
          '/jobs',
          '/companies',
          '/about',
          '/pricing',
          '/help',
          '/contacts',
          '/privacy',
          '/terms',
          '/cookies',
          '/api/jobs',
          '/api/companies',
          '/api/health'
        ]
        
        const { pathname } = new URL(token?.origin || 'http://localhost:3000')
        
        // Allow public routes
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}