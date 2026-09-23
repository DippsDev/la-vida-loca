type AuthMethod = 'supabase' | 'password'

type AuthUser = {
  email?: string | null
  app_metadata?: Record<string, unknown>
}

/** Hosted Supabase rejects reserved domains such as .local, so the account is never saved. */
const ADMIN_EMAIL_DOMAIN = 'lavidaloca.com'

/** Supabase Auth signs in with email. The username is the mailbox name. */
export function adminEmailFromUsername(username: string) {
  const name = username.trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{0,30}[a-z0-9]$/.test(name)) return null
  return `${name}@${ADMIN_EMAIL_DOMAIN}`
}

function adminUsernameFromUser(user: AuthUser | null | undefined) {
  const username = user?.app_metadata?.username
  if (typeof username === 'string' && username.trim()) return username.trim()
  const email = user?.email ?? ''
  const name = email.split('@')[0]
  return name || null
}

function isAdminUser(user: AuthUser | null | undefined) {
  if (user?.app_metadata?.role === 'admin') return true
  return (user?.email ?? '').toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`)
}

export function useAdminAuth() {
  const config = useRuntimeConfig()

  const ready = useState('admin-auth-ready', () => false)
  const isAuthenticated = useState('admin-auth-ok', () => false)
  const authMethod = useState<AuthMethod | null>('admin-auth-method', () => null)
  const adminEmail = useState<string | null>('admin-auth-email', () => null)
  const adminUsername = useState<string | null>('admin-auth-username', () => null)

  const hasSupabase = computed(
    () => Boolean(config.public.supabaseUrl && config.public.supabaseAnonKey),
  )

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

  function acceptAdmin(user: AuthUser | null | undefined) {
    if (!isAdminUser(user)) return false
    isAuthenticated.value = true
    authMethod.value = 'supabase'
    adminEmail.value = user?.email ?? null
    adminUsername.value = adminUsernameFromUser(user)
    ready.value = true
    return true
  }

  async function refreshSupabaseSession() {
    if (!hasSupabase.value) return false

    const supabase = useSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (acceptAdmin(user)) return true

    if (user) await supabase.auth.signOut()
    return false
  }

  async function ensureReady() {
    if (ready.value) return

    isAuthenticated.value = false
    authMethod.value = null
    adminEmail.value = null
    adminUsername.value = null

    const viaSupabase = await refreshSupabaseSession()
    if (!viaSupabase) {
      await refreshPasswordSession()
    }

    ready.value = true
  }

  function signupFailureMessage(message: string, code?: string) {
    const detail = message.toLowerCase()
    if (code === 'over_email_send_rate_limit' || detail.includes('rate limit')) {
      return 'Supabase did not save that admin. Turn off Confirm email under Authentication → Providers → Email, wait a few minutes, then sign in again.'
    }
    if (code === 'email_address_invalid' || detail.includes('invalid')) {
      return 'Supabase did not save that admin because it rejected the email address.'
    }
    return 'That username or PIN is not right.'
  }

  async function loginWithUsername(username: string, pin: string) {
    if (!hasSupabase.value) {
      throw new Error('Supabase sign-in is not configured.')
    }

    const email = adminEmailFromUsername(username)
    const secret = pin.trim()
    if (!email || secret.length < 6) {
      throw new Error('Enter an admin username and a PIN of at least 6 characters.')
    }

    const supabase = useSupabaseClient()
    const signedIn = await supabase.auth.signInWithPassword({ email, password: secret })

    if (signedIn.error) {
      const created = await supabase.auth.signUp({ email, password: secret })
      if (created.error) {
        throw new Error(signupFailureMessage(created.error.message, created.error.code))
      }
      const retry = await supabase.auth.signInWithPassword({ email, password: secret })
      if (retry.error) {
        const detail = retry.error.message.toLowerCase()
        if (detail.includes('confirm')) {
          throw new Error('That admin account is saved in Supabase Auth, but the email still needs to be confirmed before sign-in.')
        }
        throw new Error('That username or PIN is not right.')
      }
      if (!acceptAdmin(retry.data.user)) {
        await supabase.auth.signOut()
        throw new Error('This account is not authorized for admin access.')
      }
      return
    }

    if (!acceptAdmin(signedIn.data.user)) {
      await supabase.auth.signOut()
      throw new Error('This account is not authorized for admin access.')
    }
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
    adminUsername.value = null
    ready.value = true
  }

  return {
    ready,
    isAuthenticated,
    authMethod,
    adminEmail,
    adminUsername,
    hasSupabase,
    ensureReady,
    loginWithUsername,
    loginWithPassword,
    logout,
  }
}
