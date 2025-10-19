import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { NextResponse } from "next/server"

export type UserRole = "jobseeker" | "employer" | "admin"

export interface AuthUser {
  id: string
  email: string
  name?: string
  role: UserRole
  avatar?: string
}

/**
 * Get the current authenticated user from the server session
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }
  
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name || undefined,
    role: session.user.role as UserRole,
    avatar: session.user.image || undefined,
  }
}

/**
 * Protect a route - requires authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }
  
  return user
}

/**
 * Check if user has required role
 */
export function requireRole(user: AuthUser, requiredRoles: UserRole[]): void {
  if (!requiredRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`)
  }
}

/**
 * Protect API route with authentication and optional role check
 */
export async function protectApiRoute(requiredRoles?: UserRole[]) {
  try {
    const user = await requireAuth()
    
    if (requiredRoles) {
      requireRole(user, requiredRoles)
    }
    
    return user
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 401 }
    )
  }
}

/**
 * Create a rate limiter for API routes
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  
  constructor(private windowMs: number, private maxRequests: number) {}
  
  isAllowed(ip: string): boolean {
    const now = Date.now()
    const record = this.requests.get(ip)
    
    if (!record || now > record.resetTime) {
      // New window or expired
      this.requests.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }
    
    if (record.count >= this.maxRequests) {
      return false
    }
    
    record.count++
    return true
  }
  
  getResetTime(ip: string): number {
    const record = this.requests.get(ip)
    return record ? record.resetTime : Date.now() + this.windowMs
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * Security headers for API responses
 */
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response): Response {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Validate request origin for CSRF protection
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  if (!origin) {
    return false
  }
  
  // In production, check against allowed domains
  if (process.env.NODE_ENV === 'production') {
    const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || []
    return allowedDomains.some(domain => origin.includes(domain))
  }
  
  // In development, allow localhost
  return origin.includes('localhost') || origin.includes('127.0.0.1')
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize object properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result = {} as T
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      result[key] = sanitizeInput(obj[key])
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      result[key] = sanitizeObject(obj[key])
    } else {
      result[key] = obj[key]
    }
  }
  
  return result
}