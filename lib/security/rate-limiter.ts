// Rate Limiter for API endpoints
// IP-based rate limiting with sliding window algorithm

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
  lastCleanup = now
}

export interface RateLimitConfig {
  maxRequests: number  // Maximum requests per window
  windowMs: number     // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

// Default: 60 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const key = identifier
  const record = rateLimitStore.get(key)

  // First request or window expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }

  // Within window
  if (record.count < config.maxRequests) {
    record.count++
    return {
      success: true,
      remaining: config.maxRequests - record.count,
      resetTime: record.resetTime
    }
  }

  // Rate limited
  return {
    success: false,
    remaining: 0,
    resetTime: record.resetTime,
    retryAfter: Math.ceil((record.resetTime - now) / 1000)
  }
}

// Get client IP from request headers
export function getClientIP(request: Request): string {
  // Check common headers for real IP (when behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback - this won't work in serverless but provides a fallback
  return 'unknown'
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Standard API endpoints
  default: { maxRequests: 60, windowMs: 60 * 1000 },

  // Strict limits for sensitive operations
  auth: { maxRequests: 10, windowMs: 60 * 1000 },

  // AI analysis - expensive operation
  ai: { maxRequests: 5, windowMs: 60 * 1000 },

  // Whale transactions - less strict
  whale: { maxRequests: 30, windowMs: 60 * 1000 },

  // Cron jobs - very limited
  cron: { maxRequests: 5, windowMs: 60 * 1000 },
}
