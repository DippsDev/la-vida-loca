import { createClient } from '~/utils/supabase/server'

const PLACEHOLDER_KEYS = new Set(['your-anon-key', 'your_anon_key'])

function shouldRefresh(pathname: string) {
  if (pathname.startsWith('/_nuxt') || pathname.startsWith('/__nuxt')) return false
  return !/\.[a-z0-9]+$/i.test(pathname)
}

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  if (!shouldRefresh(pathname)) return

  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabaseAnonKey
  if (!url || !key || url.includes('YOUR_PROJECT') || PLACEHOLDER_KEYS.has(key)) return

  const supabase = createClient(event)

  try {
    await supabase.auth.getClaims()
  }
  catch {
    // A failed refresh should not block the page.
  }
})
