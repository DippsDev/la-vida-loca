<script setup lang="ts">
import { GLOBE_TILE_SOURCES, SPLASH_BACKGROUNDS } from '~/utils/galleryPlaceholders'

const splashBackgrounds = SPLASH_BACKGROUNDS

const activeSlide = ref(0)
const fadeMs = 1100
const slideMs = 5500
let slideTimer: ReturnType<typeof setInterval> | null = null
let advancing = false

function advanceSlide() {
  if (advancing) return
  advancing = true

  activeSlide.value = (activeSlide.value + 1) % splashBackgrounds.length

  window.setTimeout(() => {
    advancing = false
  }, fadeMs)
}

const exiting = ref(false)

function preloadGallery() {
  void preloadRouteComponents('/home')
  void Promise.all([
    import('~/pages/home.vue'),
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
  return navigateTo('/home')
}

onMounted(() => {
  slideTimer = setInterval(advanceSlide, slideMs)
  preloadGallery()
})

onUnmounted(() => {
  if (slideTimer) clearInterval(slideTimer)
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-cobalt-deep">
    <div
      class="splash-shell fixed inset-0 z-50 flex flex-col items-center justify-center"
      :class="{ 'is-exiting': exiting }"
      aria-label="La Vida LOCA splash"
    >
      <div
        class="splash-video absolute inset-0"
        aria-hidden="true"
      >
        <img
          v-for="(src, index) in splashBackgrounds"
          :key="src"
          :src="src"
          alt=""
          class="absolute inset-0 h-full w-full object-cover transition-opacity ease-in-out"
          :class="activeSlide === index ? 'opacity-100' : 'opacity-0'"
          :style="{ transitionDuration: `${fadeMs}ms` }"
          decoding="async"
          :loading="index === 0 ? 'eager' : 'lazy'"
        >
      </div>

      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-cobalt-deep/85 via-cobalt-deep/35 to-cobalt-deep/30"
        aria-hidden="true"
      />

      <div class="splash-copy relative z-10 flex w-full flex-col items-center px-6 text-center">
        <HandwritingSignature />
        <p class="mt-3 text-xs font-medium uppercase tracking-[0.22em] text-cream/90">
          Saturday · Private villa · By invitation
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
.splash-video {
  transform: scale(1);
  opacity: 1;
  transition:
    opacity 280ms ease,
    transform 280ms ease;
}

.splash-copy {
  transform: translateY(0);
  opacity: 1;
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.splash-shell.is-exiting .splash-video {
  opacity: 0;
  transform: scale(1.03);
}

.splash-shell.is-exiting .splash-copy {
  opacity: 0;
  transform: translateY(8px);
}
</style>
