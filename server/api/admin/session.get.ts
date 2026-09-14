import {
  adminSessionCookieName,
  verifyAdminSession,
} from '../../utils/adminSession'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const token = getCookie(event, adminSessionCookieName())
  const passwordSession = verifyAdminSession(config.adminSessionSecret, token)

  return {
    authenticated: passwordSession,
    method: passwordSession ? 'password' as const : null,
  }
})
