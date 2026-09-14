import { adminSessionCookieName } from '../../utils/adminSession'

export default defineEventHandler(async (event) => {
  deleteCookie(event, adminSessionCookieName(), {
    path: '/',
  })
  return { ok: true }
})
