<script setup lang="ts">
import { GALLERY_IMAGES, useGlobeGallery } from '~/composables/useGlobeGallery'

const route = useRoute()

const {
  showVeil,
  veilOut,
  initFromSplash,
  liftVeil,
} = useGlobeGallery()

const isInteractive = computed(() => route.path === '/home')

onMounted(() => {
  initFromSplash()

  if (showVeil.value) {
    window.setTimeout(liftVeil, 2500)
  }
})
</script>

<template>
  <div
    class="persistent-globe fixed inset-0 z-0 bg-[#072a66]"
    :class="{ 'persistent-globe--interactive': isInteractive }"
    aria-hidden="false"
  >
    <!-- Hide the 3D sphere off /home so it can't stack above page content (RSVP form, etc.) -->
    <DomeGallery
      v-show="isInteractive"
      :images="GALLERY_IMAGES"
      overlay-blur-color="#072a66"
      :auto-spin="true"
      :auto-spin-speed-deg="3.2"
      :auto-spin-delay-ms="700"
      grayscale
      @ready="liftVeil"
    />

    <div
      v-if="showVeil"
      class="home-veil pointer-events-none absolute inset-0 z-30 bg-[#072a66]"
      :class="{ 'is-out': veilOut }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.persistent-globe {
  pointer-events: none;
}

.persistent-globe--interactive {
  pointer-events: auto;
}

.home-veil {
  opacity: 1;
  transition: opacity 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.home-veil.is-out {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .home-veil {
    transition-duration: 120ms;
  }
}
</style>
