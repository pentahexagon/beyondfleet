// Input sanitization utilities for XSS and injection prevention
import DOMPurify from 'isomorphic-dompurify'

// Configure DOMPurify with strict settings
const purifyConfig = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'], // Allow target but we'll set it ourselves
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style'],
}

// Sanitize HTML content (for rich text display)
export function sanitizeHTML(dirty: string): string {
  if (!dirty) return ''

  const clean = DOMPurify.sanitize(dirty, purifyConfig)

  // Ensure all links open in new tab and have security attributes
  return clean.replace(
    /<a\s+([^>]*href=["'][^"']*["'][^>]*)>/gi,
    '<a $1 target="_blank" rel="noopener noreferrer">'
  )
}

// Sanitize plain text (strip all HTML)
export function sanitizeText(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string | null {
  if (!email) return null

  const sanitized = email.toLowerCase().trim()
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

  if (!emailRegex.test(sanitized)) {
    return null
  }

  return sanitized
}

// Validate UUID format
export function isValidUUID(uuid: string): boolean {
  if (!uuid) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Validate wallet address formats
export function isValidWalletAddress(address: string, type: 'ethereum' | 'solana'): boolean {
  if (!address) return false

  if (type === 'ethereum') {
    // Ethereum: 0x followed by 40 hex characters
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  if (type === 'solana') {
    // Solana: Base58 encoded, 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }

  return false
}

// Sanitize coin ID (alphanumeric, dash, underscore only)
export function sanitizeCoinId(coinId: string): string | null {
  if (!coinId) return null

  const sanitized = coinId.toLowerCase().trim()
  if (!/^[a-z0-9-_]+$/.test(sanitized)) {
    return null
  }

  // Length limit
  if (sanitized.length > 100) {
    return null
  }

  return sanitized
}

// Sanitize numeric string
export function sanitizeNumber(value: string | number, options?: {
  min?: number
  max?: number
  allowDecimal?: boolean
}): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  if (options?.min !== undefined && num < options.min) {
    return null
  }

  if (options?.max !== undefined && num > options.max) {
    return null
  }

  if (!options?.allowDecimal && !Number.isInteger(num)) {
    return null
  }

  return num
}

// Escape special characters for safe display
export function escapeForDisplay(text: string): string {
  if (!text) return ''

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Validate and sanitize pagination parameters
export function sanitizePagination(page?: string | number, perPage?: string | number): {
  page: number
  perPage: number
} {
  const sanitizedPage = sanitizeNumber(page || 1, { min: 1, max: 1000 }) ?? 1
  const sanitizedPerPage = sanitizeNumber(perPage || 20, { min: 1, max: 100 }) ?? 20

  return {
    page: Math.floor(sanitizedPage),
    perPage: Math.floor(sanitizedPerPage)
  }
}

// SQL injection prevention - validate sort order
export function isValidSortOrder(order: string): order is 'asc' | 'desc' {
  return order === 'asc' || order === 'desc'
}

// Validate tier parameter
export function isValidTier(tier: string): tier is 'cadet' | 'navigator' | 'pilot' | 'commander' | 'admiral' {
  return ['cadet', 'navigator', 'pilot', 'commander', 'admiral'].includes(tier)
}
