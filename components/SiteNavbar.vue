<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/home', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/rsvp', label: 'RSVP' },
  { to: '/admin', label: 'Admin' },
] as const

function isActive(path: string) {
  if (path === '/admin') {
    return route.path.startsWith('/admin')
  }
  return route.path === path
}
</script>

<template>
  <header class="pointer-events-none absolute inset-x-0 top-0 z-40">
    <nav class="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <NuxtLink
        to="/home"
        class="group flex flex-col leading-none"
      >
        <span class="font-script text-3xl text-cream transition group-hover:text-white sm:text-4xl">
          La Vida
        </span>
        <span class="font-display text-sm font-extrabold tracking-brand text-cream/90 group-hover:text-white">
          LOCA
        </span>
      </NuxtLink>

      <ul class="flex items-center gap-1 sm:gap-2">
        <li
          v-for="link in links"
          :key="link.to"
        >
          <NuxtLink
            :to="link.to"
            class="px-3 py-2 text-xs font-semibold uppercase tracking-wider transition sm:px-4"
            :class="isActive(link.to)
              ? 'text-cream'
              : 'text-cream/60 hover:text-cream'"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
