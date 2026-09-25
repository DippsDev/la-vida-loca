<script setup lang="ts">
const route = useRoute()

function barePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

const globeRoutes = new Set(['/', '/gallery', '/rsvp'])
const showGlobe = ref(globeRoutes.has(barePath(route.path)))
const transitionName = useState('page-transition', () => 'page')
let hideGlobeTimer: number | undefined

onMounted(() => {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      const script = reg.active?.scriptURL ?? ''
      if (!script.includes('splash-cache.js')) continue
      void reg.unregister()
    }
  })
  if ('caches' in window) {
    void caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.startsWith('loca-splash')) void caches.delete(key)
      }
    })
  }
})

watch(() => route.path, (path, previous) => {
  const from = previous ? barePath(previous) : ''
  const to = barePath(path)
  transitionName.value = from === '/' && to === '/gallery' ? 'splash-leave' : 'page'

  if (!import.meta.client) {
    showGlobe.value = globeRoutes.has(barePath(path))
    return
  }
  window.clearTimeout(hideGlobeTimer)
  if (globeRoutes.has(barePath(path))) {
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
      :class="{ 'page-layer--passthrough': barePath(route.path) === '/gallery' }"
    >
      <NuxtPage :transition="{ name: transitionName }" />
    </div>
  </div>
</template>
