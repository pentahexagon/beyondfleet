// Secure error handling utilities
// Prevents leaking sensitive information in production

export interface SafeError {
  message: string
  code?: string
  statusCode: number
}

// Map of internal error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  'PGRST116': 'Resource not found',
  'PGRST301': 'Database connection error',
  '23505': 'This record already exists',
  '23503': 'Related record not found',
  '42501': 'Access denied',
  'RATE_LIMIT': 'Too many requests. Please try again later.',
  'UNAUTHORIZED': 'Authentication required',
  'FORBIDDEN': 'You do not have permission to perform this action',
  'VALIDATION_ERROR': 'Invalid input data',
  'NOT_FOUND': 'Resource not found',
  'INTERNAL_ERROR': 'An unexpected error occurred',
}

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production'

// Convert any error to a safe, user-friendly error
export function toSafeError(error: unknown): SafeError {
  // Already a SafeError
  if (isSafeError(error)) {
    return error
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for known error codes
    const errorCode = extractErrorCode(error)
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return {
        message: ERROR_MESSAGES[errorCode],
        code: errorCode,
        statusCode: getStatusCodeForError(errorCode)
      }
    }

    // In production, return generic message
    if (isProduction) {
      return {
        message: ERROR_MESSAGES['INTERNAL_ERROR'],
        statusCode: 500
      }
    }

    // In development, return actual error message
    return {
      message: error.message,
      statusCode: 500
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (isProduction) {
      return {
        message: ERROR_MESSAGES['INTERNAL_ERROR'],
        statusCode: 500
      }
    }
    return {
      message: error,
      statusCode: 500
    }
  }

  // Unknown error type
  return {
    message: ERROR_MESSAGES['INTERNAL_ERROR'],
    statusCode: 500
  }
}

// Check if value is a SafeError
function isSafeError(value: unknown): value is SafeError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    'statusCode' in value
  )
}

// Extract error code from various error formats
function extractErrorCode(error: Error): string | null {
  // Supabase/PostgreSQL errors
  if ('code' in error && typeof (error as Record<string, unknown>).code === 'string') {
    return (error as Record<string, unknown>).code as string
  }

  // Check error message for known patterns
  const message = error.message.toLowerCase()
  if (message.includes('rate limit')) return 'RATE_LIMIT'
  if (message.includes('unauthorized') || message.includes('not authenticated')) return 'UNAUTHORIZED'
  if (message.includes('forbidden') || message.includes('access denied')) return 'FORBIDDEN'
  if (message.includes('not found')) return 'NOT_FOUND'
  if (message.includes('validation') || message.includes('invalid')) return 'VALIDATION_ERROR'

  return null
}

// Map error codes to HTTP status codes
function getStatusCodeForError(code: string): number {
  const statusMap: Record<string, number> = {
    'PGRST116': 404,
    'PGRST301': 503,
    '23505': 409,
    '23503': 400,
    '42501': 403,
    'RATE_LIMIT': 429,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'VALIDATION_ERROR': 400,
    'NOT_FOUND': 404,
    'INTERNAL_ERROR': 500,
  }

  return statusMap[code] || 500
}

// Log error securely (full details on server, safe details elsewhere)
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const safeError = toSafeError(error)

  // Always log to console on server
  if (typeof window === 'undefined') {
    console.error({
      timestamp,
      ...context,
      error: isProduction
        ? { message: safeError.message, code: safeError.code }
        : error
    })
  }

  // In production, could send to logging service here
  // e.g., Sentry, LogRocket, etc.
}

// Create standardized API error response
export function createErrorResponse(error: unknown): {
  error: string
  code?: string
} {
  const safeError = toSafeError(error)
  return {
    error: safeError.message,
    ...(safeError.code ? { code: safeError.code } : {})
  }
}

// Validation error helper
export function validationError(field: string, message: string): SafeError {
  return {
    message: `Invalid ${field}: ${message}`,
    code: 'VALIDATION_ERROR',
    statusCode: 400
  }
}

// Not found error helper
export function notFoundError(resource: string): SafeError {
  return {
    message: `${resource} not found`,
    code: 'NOT_FOUND',
    statusCode: 404
  }
}

// Unauthorized error helper
export function unauthorizedError(): SafeError {
  return {
    message: ERROR_MESSAGES['UNAUTHORIZED'],
    code: 'UNAUTHORIZED',
    statusCode: 401
  }
}

// Forbidden error helper
export function forbiddenError(): SafeError {
  return {
    message: ERROR_MESSAGES['FORBIDDEN'],
    code: 'FORBIDDEN',
    statusCode: 403
  }
}
