<script setup lang="ts">
definePageMeta({
  ssr: false,
})

useHead({ title: 'Gallery · La Vida Loca' })

const { navIn } = useGlobeGallery()

onMounted(() => {
  void preloadRouteComponents('/rsvp')
})
</script>

<template>
  <div class="pointer-events-none relative h-[100dvh] w-screen overflow-hidden">
    <div
      class="home-nav pointer-events-auto absolute inset-x-0 top-0 z-20"
      :class="{ 'is-in': navIn }"
    >
      <SiteNavbar />
    </div>
  </div>
</template>

<style scoped>
.home-nav {
  opacity: 0;
  transform: translateY(-8px);
  transition:
    opacity 450ms cubic-bezier(0.22, 1, 0.36, 1) 80ms,
    transform 450ms cubic-bezier(0.22, 1, 0.36, 1) 80ms;
}

.home-nav.is-in {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .home-nav {
    transition-duration: 120ms;
    transform: none;
  }
}
</style>
