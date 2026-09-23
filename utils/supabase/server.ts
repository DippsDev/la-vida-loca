import { createServerClient, parseCookieHeader, type CookieOptions } from '@supabase/ssr'
import { getRequestHeader, setCookie, setHeader, type H3Event } from 'h3'
import type { Database } from './database'

function readCookies(event: H3Event) {
  return parseCookieHeader(getRequestHeader(event, 'cookie') ?? '')
}

function writeCookies(
  event: H3Event,
  cookiesToSet: { name: string, value: string, options: CookieOptions }[],
  headers: Record<string, string>,
) {
  const jar = new Map(readCookies(event).map(cookie => [cookie.name, cookie.value]))

  cookiesToSet.forEach(({ name, value, options }) => {
    jar.set(name, value)
    setCookie(event, name, value, options)
  })

  Object.entries(headers).forEach(([key, value]) => {
    setHeader(event, key, value)
  })

  event.node.req.headers.cookie = [...jar.entries()]
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

export function createClient(event: H3Event = useRequestEvent()!) {
  const config = useRuntimeConfig()

  return createServerClient<Database>(
    config.public.supabaseUrl,
    config.public.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          if (!event) return []
          return readCookies(event)
        },
        setAll(cookiesToSet, headers) {
          if (!event) return
          try {
            writeCookies(event, cookiesToSet, headers)
          }
          catch {
            // Cookie writes from a rendered page can be ignored when
            // server middleware is already refreshing the session.
          }
        },
      },
    },
  )
}
