// CSRF Token utilities
// Using double-submit cookie pattern for Next.js

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const CSRF_TOKEN_NAME = 'csrf-token'
export const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

// Generate a cryptographically secure token
export function generateCSRFToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Get or create CSRF token from cookies
export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value

  if (!token) {
    token = generateCSRFToken()
  }

  return token
}

// Validate CSRF token from request
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(request.method)
  if (safeMethod) {
    return true
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }

  return result === 0
}

// Set CSRF token cookie in response
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript for header inclusion
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  return response
}

// Middleware helper to enforce CSRF validation
export function csrfProtect(request: NextRequest): NextResponse | null {
  if (!validateCSRFToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }
  return null
}
