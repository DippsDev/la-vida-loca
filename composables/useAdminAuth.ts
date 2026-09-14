type AuthMethod = 'supabase' | 'password'

export function useAdminAuth() {
  const config = useRuntimeConfig()

  const ready = useState('admin-auth-ready', () => false)
  const isAuthenticated = useState('admin-auth-ok', () => false)
  const authMethod = useState<AuthMethod | null>('admin-auth-method', () => null)
  const adminEmail = useState<string | null>('admin-auth-email', () => null)

  const hasSupabase = computed(
    () => Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey),
  )

  const allowedEmails = computed(() =>
    String(config.public.adminEmails || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean),
  )

  function isAllowedEmail(email: string | undefined | null) {
    if (!email || !allowedEmails.value.length) return false
    return allowedEmails.value.includes(email.trim().toLowerCase())
  }

  async function refreshPasswordSession() {
    try {
      const session = await $fetch<{ authenticated: boolean; method: AuthMethod | null }>(
        '/api/admin/session',
      )
      if (session.authenticated) {
        isAuthenticated.value = true
        authMethod.value = 'password'
        adminEmail.value = null
        return true
      }
    }
    catch {
      // ignore
    }
    return false
  }

  async function refreshSupabaseSession() {
    if (!hasSupabase.value) return false

    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const email = session?.user?.email

    if (session?.user && isAllowedEmail(email)) {
      isAuthenticated.value = true
      authMethod.value = 'supabase'
      adminEmail.value = email ?? null
      return true
    }

    if (session?.user && !isAllowedEmail(email)) {
      await supabase.auth.signOut()
    }

    return false
  }

  async function ensureReady() {
    if (ready.value) return

    isAuthenticated.value = false
    authMethod.value = null
    adminEmail.value = null

    const viaSupabase = await refreshSupabaseSession()
    if (!viaSupabase) {
      await refreshPasswordSession()
    }

    ready.value = true
  }

  async function loginWithSupabase(email: string, password: string) {
    if (!hasSupabase.value) {
      throw new Error('Supabase sign-in is not configured.')
    }
    if (!allowedEmails.value.length) {
      throw new Error('No admin emails are configured.')
    }

    const supabase = useSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) throw error

    if (!isAllowedEmail(data.user?.email)) {
      await supabase.auth.signOut()
      throw new Error('This account is not authorized for admin access.')
    }

    isAuthenticated.value = true
    authMethod.value = 'supabase'
    adminEmail.value = data.user?.email ?? null
    ready.value = true
  }

  async function loginWithPassword(password: string) {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { password },
    })

    isAuthenticated.value = true
    authMethod.value = 'password'
    adminEmail.value = null
    ready.value = true
  }

  function loginForShowcase() {
    isAuthenticated.value = true
    authMethod.value = null
    adminEmail.value = null
    ready.value = true
  }

  async function logout() {
    if (authMethod.value === 'supabase') {
      const supabase = useSupabaseClient()
      await supabase.auth.signOut()
    }

    if (authMethod.value === 'password') {
      try {
        await $fetch('/api/admin/logout', { method: 'POST' })
      }
      catch {
        // ignore
      }
    }

    isAuthenticated.value = false
    authMethod.value = null
    adminEmail.value = null
    ready.value = true
  }

  return {
    ready,
    isAuthenticated,
    authMethod,
    adminEmail,
    hasSupabase,
    allowedEmails,
    ensureReady,
    loginWithSupabase,
    loginWithPassword,
    loginForShowcase,
    logout,
  }
}
