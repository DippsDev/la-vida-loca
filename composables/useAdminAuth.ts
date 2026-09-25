type AuthMethod = 'supabase' | 'password'

type AuthUser = {
  id?: string | null
  email?: string | null
  app_metadata?: Record<string, unknown>
}

/** The only Supabase Authentication users allowed into the admin dashboard. */
const ADMIN_USER_IDS = new Set([
  'fe63c40e-ec60-4292-a363-d1ff25ea9a6d',
  'f608cc37-8029-43bc-80c8-46842709c41d',
])

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
  return typeof user?.id === 'string' && ADMIN_USER_IDS.has(user.id)
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
    if (!supabase) return false
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

    await refreshSupabaseSession()

    ready.value = true
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
    if (!supabase) {
      throw new Error('Supabase sign-in is not configured.')
    }
    const signedIn = await supabase.auth.signInWithPassword({ email, password: secret })

    if (signedIn.error || !acceptAdmin(signedIn.data.user)) {
      if (signedIn.data.user) await supabase.auth.signOut()
      throw new Error('That username or PIN is not right.')
    }
  }

  async function logout() {
    if (authMethod.value === 'supabase') {
      const supabase = useSupabaseClient()
      await supabase?.auth.signOut()
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
    logout,
  }
}
