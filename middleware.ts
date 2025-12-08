import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIP, RATE_LIMITS } from '@/lib/security/rate-limiter'
import { generateCSRFToken, CSRF_TOKEN_NAME, CSRF_HEADER_NAME } from '@/lib/security/csrf'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Apply security headers to all responses
  applySecurityHeaders(response)

  // Only apply rate limiting and CSRF to API routes
  if (pathname.startsWith('/api')) {
    // Determine rate limit config based on endpoint
    const rateLimitConfig = getRateLimitConfig(pathname)
    const clientIP = getClientIP(request)
    const rateLimitKey = `${clientIP}:${pathname.split('/').slice(0, 4).join('/')}`

    const result = rateLimit(rateLimitKey, rateLimitConfig)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: result.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(result.retryAfter),
            'X-RateLimit-Limit': String(rateLimitConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000))
          }
        }
      )
    }

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(rateLimitConfig.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))

    // CSRF validation for mutating requests (POST, PUT, DELETE, PATCH)
    const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    if (mutatingMethods.includes(request.method)) {
      // Skip CSRF for certain endpoints (auth, cron, webhooks)
      const csrfExempt = ['/api/auth', '/api/cron', '/api/webhook']
      const isExempt = csrfExempt.some(prefix => pathname.startsWith(prefix))

      if (!isExempt) {
        const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value
        const headerToken = request.headers.get(CSRF_HEADER_NAME)

        if (!cookieToken || !headerToken || !constantTimeCompare(cookieToken, headerToken)) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          )
        }
      }
    }
  }

  // Set CSRF token cookie if not present
  if (!request.cookies.has(CSRF_TOKEN_NAME)) {
    const token = generateCSRFToken()
    response.cookies.set(CSRF_TOKEN_NAME, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24
    })
  }

  return response
}

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith('/api/auth')) {
    return RATE_LIMITS.auth
  }
  if (pathname.startsWith('/api/ai')) {
    return RATE_LIMITS.ai
  }
  if (pathname.startsWith('/api/whale')) {
    return RATE_LIMITS.whale
  }
  if (pathname.startsWith('/api/cron')) {
    return RATE_LIMITS.cron
  }
  return RATE_LIMITS.default
}

function applySecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // XSS Protection (legacy, but good for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-inline/eval
    "style-src 'self' 'unsafe-inline'", // Tailwind CSS needs unsafe-inline
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.coingecko.com https://min-api.cryptocompare.com https://api.whale-alert.io https://api.anthropic.com wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspDirectives)

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
