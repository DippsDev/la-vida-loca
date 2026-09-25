<script setup lang="ts">
import { GLOBE_TILE_SOURCES } from '~/utils/galleryPlaceholders'

const exiting = ref(false)

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
    void img.decode().catch(() => {})
  })
}

const pageTransition = useState('page-transition', () => 'page')

function enterSite() {
  if (exiting.value) return
  exiting.value = true
  pageTransition.value = 'splash-leave'

  try {
    sessionStorage.setItem('loca-from-splash', '1')
  }
  catch {
    // Private mode / blocked storage — home still works without the enter cue.
  }

  return navigateTo('/gallery')
}

onMounted(() => {
  preloadGallery()
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-cobalt-deep">
    <div
      class="splash-shell fixed inset-0 z-50 flex flex-col items-center justify-center bg-cobalt-deep"
      :class="{ 'is-exiting': exiting }"
      aria-label="La Vida LOCA splash"
    >
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
  transition: opacity 200ms ease;
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
