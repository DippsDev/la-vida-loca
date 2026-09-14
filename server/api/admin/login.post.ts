import {
  adminSessionCookieName,
  signAdminSession,
} from '../../utils/adminSession'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ password?: string }>(event)
  const password = body?.password?.trim()

  if (!config.adminPassword) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin password login is not configured.',
    })
  }

  if (!password || password !== config.adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password.',
    })
  }

  if (!config.adminSessionSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Admin session secret is not configured.',
    })
  }

  setCookie(event, adminSessionCookieName(), signAdminSession(config.adminSessionSecret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { ok: true, method: 'password' as const }
})
