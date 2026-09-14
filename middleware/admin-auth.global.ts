export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (import.meta.server) return

  const auth = useAdminAuth()
  await auth.ensureReady()

  if (to.path === '/admin/login') {
    if (auth.isAuthenticated.value) {
      return navigateTo('/admin')
    }
    return
  }

  if (!auth.isAuthenticated.value) {
    return navigateTo('/admin/login')
  }
})
