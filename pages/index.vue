<script setup lang="ts">
import { GLOBE_TILE_SOURCES } from '~/utils/galleryPlaceholders'

const exiting = ref(false)
const videoA = ref<HTMLVideoElement | null>(null)
const videoB = ref<HTMLVideoElement | null>(null)
const visible = ref<'a' | 'b'>('a')

const loopBlendSeconds = 1.6
let blending = false

function partner(which: 'a' | 'b') {
  return which === 'a' ? videoB.value : videoA.value
}

function softenLoop(which: 'a' | 'b', event: Event) {
  if (which !== visible.value || blending) return
  const video = event.target as HTMLVideoElement
  if (!Number.isFinite(video.duration) || video.duration < loopBlendSeconds + 0.4) return
  if (video.duration - video.currentTime > loopBlendSeconds) return

  const next = partner(which)
  if (!next) return
  blending = true
  next.currentTime = 0
  void next.play()
  visible.value = which === 'a' ? 'b' : 'a'
}

function finishLoop(which: 'a' | 'b') {
  const video = which === 'a' ? videoA.value : videoB.value
  video?.pause()
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

onMounted(() => {
  preloadGallery()
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#072a66]">
    <div
      class="splash-shell fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#072a66]"
      :class="{ 'is-exiting': exiting }"
      aria-label="La Vida LOCA splash"
    >
      <video
        ref="videoA"
        class="splash-video"
        :class="{ 'is-visible': visible === 'a' }"
        autoplay
        muted
        playsinline
        preload="auto"
        aria-hidden="true"
        @timeupdate="softenLoop('a', $event)"
        @ended="finishLoop('a')"
      >
        <source
          src="/splash-ibiza.mp4"
          type="video/mp4"
        >
      </video>
      <video
        ref="videoB"
        class="splash-video"
        :class="{ 'is-visible': visible === 'b' }"
        muted
        playsinline
        preload="auto"
        aria-hidden="true"
        @timeupdate="softenLoop('b', $event)"
        @ended="finishLoop('b')"
      >
        <source
          src="/splash-ibiza.mp4"
          type="video/mp4"
        >
      </video>
      <div
        class="splash-veil"
        aria-hidden="true"
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
  transition: opacity 280ms ease;
}

.splash-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.6s ease-in-out;
}

.splash-video.is-visible {
  z-index: 1;
  opacity: 1;
}

.splash-veil {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    radial-gradient(ellipse at 50% 46%, rgb(7 42 102 / 0.78), rgb(7 42 102 / 0.42) 58%, rgb(7 42 102 / 0.55));
}

@media (prefers-reduced-motion: reduce) {
  .splash-video {
    display: none;
  }
}

.splash-copy {
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
