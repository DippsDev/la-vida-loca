<script setup lang="ts">
const route = useRoute()

const menuOpen = ref(false)
const iconOpen = ref(false)

const links = [
  { to: '/home', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/rsvp', label: 'RSVP' },
  { to: '/status', label: 'Status' },
  { to: '/admin', label: 'Admin' },
] as const

const linkCount = links.length

function isActive(path: string) {
  if (path === '/admin') {
    return route.path.startsWith('/admin')
  }
  return route.path === path
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

watch(() => route.fullPath, closeMenu)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

watch(menuOpen, async (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''

  if (open) {
    iconOpen.value = false
    await nextTick()
    requestAnimationFrame(() => {
      iconOpen.value = true
    })
  }
  else {
    iconOpen.value = false
  }
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <header class="pointer-events-none absolute inset-x-0 top-0 z-40">
    <nav class="pointer-events-auto relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
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

      <!-- Desktop links -->
      <ul class="hidden items-center gap-2 md:flex">
        <li
          v-for="link in links"
          :key="link.to"
        >
          <NuxtLink
            :to="link.to"
            class="px-4 py-2 text-xs font-semibold uppercase tracking-wider transition"
            :class="isActive(link.to)
              ? 'text-cream'
              : 'text-cream/60 hover:text-cream'"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <!-- Mobile toggle -->
      <button
        type="button"
        class="flex h-11 w-11 shrink-0 items-center justify-center text-cream md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="site-mobile-menu"
        aria-label="Open menu"
        @click="toggleMenu"
      >
        <span class="sr-only">Open menu</span>
        <span
          class="menu-icon"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </span>
      </button>
    </nav>

    <!-- Teleported so 3D globe stacking can't cover the panel -->
    <Teleport to="body">
      <Transition
        name="mobile-menu"
        :duration="{ enter: 520, leave: 400 }"
      >
        <div
          v-if="menuOpen"
          id="site-mobile-menu"
          class="mobile-menu fixed inset-0 z-[200] flex flex-col md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div
            class="mobile-menu__veil absolute inset-0 bg-cobalt-deep"
            aria-hidden="true"
          />

          <div class="mobile-menu__chrome relative mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
            <NuxtLink
              to="/home"
              class="group flex flex-col leading-none"
              @click="closeMenu"
            >
              <span class="font-script text-3xl text-cream transition group-hover:text-white sm:text-4xl">
                La Vida
              </span>
              <span class="font-display text-sm font-extrabold tracking-brand text-cream/90 group-hover:text-white">
                LOCA
              </span>
            </NuxtLink>

            <button
              type="button"
              class="flex h-11 w-11 shrink-0 items-center justify-center text-cream"
              aria-label="Close menu"
              @click="closeMenu"
            >
              <span class="sr-only">Close menu</span>
              <span
                class="menu-icon"
                :class="{ 'is-open': iconOpen }"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>

          <ul class="relative flex flex-1 flex-col items-center justify-center gap-1 px-6 pb-16">
            <li
              v-for="(link, index) in links"
              :key="link.to"
              class="mobile-link"
              :style="{ '--i': index, '--n': linkCount - 1 }"
            >
              <NuxtLink
                :to="link.to"
                class="block px-6 py-3.5 text-center font-display text-3xl font-semibold tracking-wide transition-colors"
                :class="isActive(link.to)
                  ? 'text-cream'
                  : 'text-cream/55 hover:text-cream'"
                @click="closeMenu"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.menu-icon {
  position: relative;
  display: block;
  width: 22px;
  height: 14px;
}

.menu-icon span {
  position: absolute;
  left: 0;
  display: block;
  width: 100%;
  height: 1.5px;
  background: currentColor;
  border-radius: 999px;
  transition:
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 200ms ease,
    top 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.menu-icon span:nth-child(1) {
  top: 0;
}

.menu-icon span:nth-child(2) {
  top: 6px;
}

.menu-icon span:nth-child(3) {
  top: 12px;
}

.menu-icon.is-open span:nth-child(1) {
  top: 6px;
  transform: rotate(45deg);
}

.menu-icon.is-open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0.4);
}

.menu-icon.is-open span:nth-child(3) {
  top: 6px;
  transform: rotate(-45deg);
}
</style>

<!-- Unscoped so Teleport + Transition classes stay reliable -->
<style>
.mobile-menu-enter-active {
  transition: opacity 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-menu-leave-active {
  transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 80ms;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-active .mobile-menu__veil {
  transition: opacity 380ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-menu-leave-active .mobile-menu__veil {
  transition: opacity 260ms cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-enter-from .mobile-menu__veil,
.mobile-menu-leave-to .mobile-menu__veil {
  opacity: 0;
}

.mobile-menu-enter-active .mobile-menu__chrome,
.mobile-menu-leave-active .mobile-menu__chrome {
  transition:
    opacity 360ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-menu-enter-from .mobile-menu__chrome {
  opacity: 0;
  transform: translateY(-10px);
}

.mobile-menu-leave-to .mobile-menu__chrome {
  opacity: 0;
  transform: translateY(-6px);
}

.mobile-menu-enter-active .mobile-link {
  transition:
    opacity 420ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: calc(90ms + var(--i) * 55ms);
}

.mobile-menu-leave-active .mobile-link {
  transition:
    opacity 220ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: calc((var(--n) - var(--i)) * 40ms);
}

.mobile-menu-enter-from .mobile-link {
  opacity: 0;
  transform: translateY(18px);
}

.mobile-menu-leave-to .mobile-link {
  opacity: 0;
  transform: translateY(-10px);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-enter-active,
  .mobile-menu-leave-active,
  .mobile-menu-enter-active .mobile-menu__veil,
  .mobile-menu-leave-active .mobile-menu__veil,
  .mobile-menu-enter-active .mobile-menu__chrome,
  .mobile-menu-leave-active .mobile-menu__chrome,
  .mobile-menu-enter-active .mobile-link,
  .mobile-menu-leave-active .mobile-link {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
</style>
