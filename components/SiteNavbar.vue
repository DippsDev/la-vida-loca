<script setup lang="ts">
const route = useRoute()

const menuOpen = ref(false)
const iconOpen = ref(false)
const nudgeMenu = ref(false)

const links = [
  { to: '/gallery', label: 'Gallery' },
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

function rememberMenu() {
  nudgeMenu.value = false
  try {
    sessionStorage.setItem('loca-menu-seen', '1')
  }
  catch {
    // Private mode can block storage. The nudge still stops for this view.
  }
}

function toggleMenu() {
  if (!menuOpen.value) rememberMenu()
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
  try {
    nudgeMenu.value = sessionStorage.getItem('loca-menu-seen') !== '1'
  }
  catch {
    nudgeMenu.value = true
  }
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
        to="/gallery"
        class="group flex flex-col leading-none"
      >
        <img
          src="/logo-l.png"
          alt="La Vida Loca"
          class="nav-logo -my-4 h-20 w-20 object-contain sm:-my-5 sm:h-24 sm:w-24"
        >
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
        class="menu-toggle relative flex h-11 w-11 shrink-0 items-center justify-center text-cream md:hidden"
        :class="{ 'is-nudge': nudgeMenu }"
        :aria-expanded="menuOpen"
        aria-controls="site-mobile-menu"
        aria-label="Open menu"
        @click="toggleMenu"
      >
        <span class="menu-ping" aria-hidden="true" />
        <span class="menu-ping menu-ping--late" aria-hidden="true" />
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
              to="/gallery"
              class="group flex flex-col leading-none"
              @click="closeMenu"
            >
              <img
                src="/logo-l.png"
                alt="La Vida Loca"
                class="nav-logo -my-4 h-20 w-20 object-contain sm:-my-5 sm:h-24 sm:w-24"
              >
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
.nav-logo {
  mix-blend-mode: lighten;
}

.menu-ping {
  position: absolute;
  inset: 1px;
  border-radius: 999px;
  border: 1.5px solid #f5f0e6;
  box-shadow:
    0 0 0 1px rgb(7 42 102 / 0.45),
    0 0 16px rgb(245 240 230 / 0.35);
  opacity: 0;
  pointer-events: none;
}

.menu-toggle.is-nudge .menu-ping {
  animation: menu-ping 2.15s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.menu-toggle.is-nudge .menu-ping--late {
  animation-delay: 0.38s;
}

.menu-toggle.is-nudge {
  border-radius: 999px;
  animation: menu-glow 2.15s ease-in-out infinite;
}

.menu-toggle.is-nudge .menu-icon {
  animation: menu-pop 2.15s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.menu-icon {
  position: relative;
  z-index: 1;
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

@keyframes menu-glow {
  0%,
  100% {
    background-color: rgb(245 240 230 / 0.08);
    box-shadow: 0 0 0 0 rgb(245 240 230 / 0);
  }

  32% {
    background-color: rgb(245 240 230 / 0.28);
    box-shadow:
      0 0 0 7px rgb(245 240 230 / 0.34),
      0 0 24px rgb(245 240 230 / 0.55);
  }
}

@keyframes menu-ping {
  0% {
    transform: scale(0.7);
    opacity: 0.2;
  }

  18% {
    transform: scale(0.86);
    opacity: 1;
  }

  68% {
    transform: scale(1.9);
    opacity: 0;
  }

  100% {
    transform: scale(1.9);
    opacity: 0;
  }
}

@keyframes menu-pop {
  0%,
  24%,
  100% {
    transform: scale(1);
  }

  8% {
    transform: scale(1.38);
  }

  15% {
    transform: scale(0.9);
  }

  20% {
    transform: scale(1.14);
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-toggle.is-nudge,
  .menu-toggle.is-nudge .menu-ping,
  .menu-toggle.is-nudge .menu-icon {
    animation: none;
  }

  .menu-toggle.is-nudge {
    background-color: rgb(245 240 230 / 0.16);
    box-shadow: 0 0 0 6px rgb(245 240 230 / 0.22);
  }

  .menu-toggle.is-nudge .menu-ping {
    opacity: 0.85;
    transform: none;
  }

  .menu-toggle.is-nudge .menu-ping--late {
    display: none;
  }
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
