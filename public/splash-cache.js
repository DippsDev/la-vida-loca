const CACHE = 'loca-splash-v3'
const FILES = new Set([
  '/splash-ibiza-1080.mp4',
  '/splash-swim-1.mp4',
  '/splash-swim-2.mp4',
  '/splash-poster-1080.jpg',
])

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(
      names
        .filter(name => name.startsWith('loca-splash-') && name !== CACHE)
        .map(name => caches.delete(name)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || !FILES.has(url.pathname)) return
  event.respondWith(serve(event, url.pathname))
})

async function serve(event, pathname) {
  const cache = await caches.open(CACHE)
  const key = new URL(pathname, self.location.origin).href
  const saved = await cache.match(key)
  if (saved) return ranged(event.request, saved)

  const response = await fetch(key)
  if (response.ok && response.status === 200) {
    const copy = response.clone()
    event.waitUntil(cache.put(key, copy).catch(() => {}))
  }
  return response
}

async function ranged(request, response) {
  const header = request.headers.get('range')
  if (!header || /^bytes=0-\s*$/i.test(header)) return response

  const match = /bytes=(\d*)-(\d*)/i.exec(header)
  const bytes = await response.arrayBuffer()
  const size = bytes.byteLength
  if (!match || size === 0) {
    return new Response(bytes, { status: 200, headers: response.headers })
  }

  let start = match[1] ? Number(match[1]) : 0
  let end = match[2] ? Number(match[2]) : size - 1
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${size}` },
    })
  }
  end = Math.min(end, size - 1)

  const slice = bytes.slice(start, end + 1)
  const headers = new Headers(response.headers)
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Content-Length', String(slice.byteLength))
  headers.set('Accept-Ranges', 'bytes')
  const type = response.headers.get('Content-Type')
  if (type) headers.set('Content-Type', type)

  return new Response(slice, {
    status: 206,
    statusText: 'Partial Content',
    headers,
  })
}
