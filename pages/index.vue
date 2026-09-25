<script setup lang="ts">
import { GLOBE_TILE_SOURCES } from '~/utils/galleryPlaceholders'

const splashVideosEnabled = false

const splashClips = [
  '/splash-ibiza-1080.mp4',
  '/splash-swim-1.mp4',
  '/splash-swim-2.mp4',
]

const exiting = ref(false)
const videoA = ref<HTMLVideoElement | null>(null)
const videoB = ref<HTMLVideoElement | null>(null)
const visible = ref<'a' | 'b'>('a')
const srcA = ref('')
const srcB = ref('')
const live = ref(false)

const loopBlendSeconds = 2
let blending = false
let warmed = false
let upcoming = 2
const savedClipUrl: Record<number, string> = {}

useHead({
  link: [
    { rel: 'preload', as: 'image', href: '/splash-poster-1080.jpg', fetchpriority: 'high' },
  ],
})

function partner(which: 'a' | 'b') {
  return which === 'a' ? videoB.value : videoA.value
}

function prepare(video: HTMLVideoElement | null) {
  if (!video) return
  video.muted = true
  video.defaultMuted = true
  video.playsInline = true
  video.setAttribute('muted', '')
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
}

async function playSplash(video: HTMLVideoElement | null) {
  if (!video) return false
  prepare(video)
  try {
    await video.play()
    return !video.paused
  }
  catch {
    return false
  }
}

async function startSplash() {
  prepare(videoA.value)
  prepare(videoB.value)
  const current = visible.value === 'a' ? videoA.value : videoB.value
  if (current && !current.paused) return
  await playSplash(current)
}

async function softenLoop(which: 'a' | 'b', event: Event) {
  if (which !== visible.value || blending) return
  const video = event.target as HTMLVideoElement
  if (!Number.isFinite(video.duration) || video.duration < loopBlendSeconds + 0.4) return
  if (video.duration - video.currentTime > loopBlendSeconds) return

  const next = partner(which)
  if (!next) return
  blending = true
  try {
    next.currentTime = 0
  }
  catch {
    blending = false
    return
  }
  const started = await playSplash(next)
  if (!started || visible.value !== which) {
    blending = false
    void playSplash(video)
    return
  }
  visible.value = which === 'a' ? 'b' : 'a'
}

function finishLoop(which: 'a' | 'b') {
  const video = which === 'a' ? videoA.value : videoB.value
  if (!video) return
  if (visible.value === which && !blending) {
    video.currentTime = 0
    void playSplash(video)
    return
  }
  video.pause()
  const next = upcoming % splashClips.length
  upcoming += 1
  const url = clipUrl(next)
  if (which === 'a') srcA.value = url
  else srcB.value = url
  blending = false
}

function preloadGallery() {
  void preloadRouteComponents('/gallery')
  void Promise.all([
    import('~/pages/gallery.vue'),
    import('~/components/DomeGallery.vue'),
    import('~/components/SiteNavbar.vue'),
  ])
  GLOBE_TILE_SOURCES.forEach((src) => {
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  })
}

function enterSite() {
  if (exiting.value) return
  exiting.value = true

  try {
    sessionStorage.setItem('loca-from-splash', '1')
  }
  catch {
    // Private mode / blocked storage — home still works without the enter cue.
  }

  preloadGallery()
  return navigateTo('/gallery')
}

function clipUrl(index: number) {
  const clip = index % splashClips.length
  return savedClipUrl[clip] || splashClips[clip]
}

function warmRest() {
  if (warmed) return
  warmed = true
  live.value = true
  srcB.value = clipUrl(1)
  preloadGallery()
}

function rememberSplash() {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.register('/splash-cache.js').catch(() => {})
}

async function savedSplashUrl() {
  if (!('caches' in window)) return ''
  try {
    const cache = await caches.open('loca-splash-v3')
    const saved = await cache.match('/splash-ibiza-1080.mp4')
    if (!saved) return ''
    const blob = await saved.blob()
    if (blob.size < 100000) return ''
    const url = URL.createObjectURL(blob)
    savedClipUrl[0] = url
    return url
  }
  catch {
    return ''
  }
}

onMounted(async () => {
  if (!splashVideosEnabled) {
    preloadGallery()
    return
  }
  rememberSplash()
  srcA.value = await savedSplashUrl() || splashClips[0]
  await nextTick()
  void startSplash()
  window.addEventListener('pointerdown', () => {
    void startSplash()
  }, { once: true })
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div
      class="splash-shell fixed inset-0 z-50 flex flex-col items-center justify-center"
      :class="{ 'is-exiting': exiting, 'is-playing': live }"
      aria-label="La Vida LOCA splash"
    >
      <video
        v-if="splashVideosEnabled && srcA"
        ref="videoA"
        class="splash-video"
        :class="{ 'is-visible': visible === 'a' }"
        :src="srcA"
        poster="/splash-poster-1080.jpg"
        autoplay
        muted
        playsinline
        webkit-playsinline
        preload="auto"
        fetchpriority="high"
        aria-hidden="true"
        @loadeddata="startSplash"
        @playing="warmRest"
        @timeupdate="softenLoop('a', $event)"
        @ended="finishLoop('a')"
      />
      <video
        v-if="splashVideosEnabled && srcB"
        ref="videoB"
        class="splash-video"
        :class="{ 'is-visible': visible === 'b' }"
        :src="srcB"
        poster="/splash-poster-1080.jpg"
        muted
        playsinline
        webkit-playsinline
        preload="auto"
        aria-hidden="true"
        @timeupdate="softenLoop('b', $event)"
        @ended="finishLoop('b')"
      />

      <div class="splash-copy relative z-10 flex w-full flex-col items-center px-6 text-center">
        <HandwritingSignature />
        <p class="mt-3 text-xs font-medium uppercase tracking-[0.22em] text-cream/90">
          Private Event · By Invitation
        </p>
        <button
          type="button"
          class="mt-8 border border-cream/80 bg-cream/95 px-10 py-3 text-sm font-semibold uppercase tracking-wider text-cobalt-deep transition hover:bg-cream disabled:opacity-60"
          :disabled="exiting"
          @click="enterSite"
        >
          Enter
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.splash-shell {
  background: #0b2438 url('/splash-poster-1080.jpg') center / cover no-repeat;
  transition: opacity 280ms ease;
}

.splash-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: transparent;
  opacity: 0;
}

.splash-video.is-visible {
  z-index: 1;
  opacity: 1;
}

.splash-shell.is-playing .splash-video {
  transition: opacity 2s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .splash-video {
    display: none;
  }
}

.splash-copy {
  text-shadow: 0 2px 16px rgb(0 0 0 / 0.35);
  transform: translateY(0);
  opacity: 1;
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.splash-shell.is-exiting {
  opacity: 0;
}

.splash-shell.is-exiting .splash-copy {
  opacity: 0;
  transform: translateY(8px);
}
</style>
