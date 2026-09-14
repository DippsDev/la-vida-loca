import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'loca-admin-session'

export function adminSessionCookieName() {
  return COOKIE_NAME
}

export function signAdminSession(secret: string) {
  return createHmac('sha256', secret).update('loca-admin-v1').digest('hex')
}

export function verifyAdminSession(secret: string, token: string | undefined) {
  if (!secret || !token) return false
  const expected = signAdminSession(secret)
  try {
    return timingSafeEqual(Buffer.from(token, 'utf8'), Buffer.from(expected, 'utf8'))
  }
  catch {
    return false
  }
}
