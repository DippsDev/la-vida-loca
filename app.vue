<script setup lang="ts">
const route = useRoute()

const globeRoutes = new Set(['/home', '/rsvp'])

const showGlobe = computed(() => globeRoutes.has(route.path))
</script>

<template>
  <div class="page-shell">
    <PersistentGlobeLayer v-if="showGlobe" />
    <div
      class="page-layer"
      :class="{ 'page-layer--passthrough': route.path === '/home' }"
    >
      <NuxtPage />
    </div>
  </div>
</template>
