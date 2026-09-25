<script setup lang="ts">
const route = useRoute()

const globeRoutes = new Set(['/', '/gallery', '/rsvp'])
const showGlobe = ref(globeRoutes.has(route.path))
let hideGlobeTimer: number | undefined

watch(() => route.path, (path) => {
  if (!import.meta.client) {
    showGlobe.value = globeRoutes.has(path)
    return
  }
  window.clearTimeout(hideGlobeTimer)
  if (globeRoutes.has(path)) {
    showGlobe.value = true
    return
  }
  // Keep the globe through the close animation so it does not vanish mid-fade.
  hideGlobeTimer = window.setTimeout(() => {
    showGlobe.value = false
  }, 480)
})
</script>

<template>
  <div class="page-shell">
    <PersistentGlobeLayer v-if="showGlobe" />
    <div
      class="page-layer"
      :class="{ 'page-layer--passthrough': route.path === '/gallery' }"
    >
      <NuxtPage :transition="{ name: 'page' }" />
    </div>
  </div>
</template>
