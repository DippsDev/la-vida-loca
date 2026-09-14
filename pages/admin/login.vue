<script setup lang="ts">
definePageMeta({
  ssr: false,
})

useHead({ title: 'Admin sign in · La Vida LOCA' })

const auth = useAdminAuth()

const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  auth.loginForShowcase()
  await navigateTo('/admin')
  submitting.value = false
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-cobalt-deep">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(11_61_145/0.55),transparent_55%),linear-gradient(to_top,rgb(7_42_102)_0%,transparent_55%)]"
      aria-hidden="true"
    />

    <main class="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div class="mb-8 text-center text-cream">
        <p class="font-script text-4xl">
          La Vida Loca
        </p>
        <h1 class="mt-2 font-display text-2xl font-bold tracking-wide">
          Admin sign in
        </h1>
        <p class="mt-2 text-sm text-cream/70">
          Authorized hosts only
        </p>
      </div>

      <form
        class="rounded-sm bg-cream/95 px-6 py-7 text-ink backdrop-blur-sm md:px-8"
        @submit.prevent="onSubmit"
      >
        <p class="text-xs leading-relaxed text-ink/55">
          Showcase mode — sign in to open the admin inbox.
        </p>

        <button
          type="submit"
          class="mt-5 w-full bg-cobalt-deep px-4 py-3 text-sm font-semibold uppercase tracking-wider text-cream transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="submitting"
        >
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <NuxtLink
        to="/home"
        class="mt-6 block text-center text-xs font-semibold uppercase tracking-wider text-cream/70 transition hover:text-cream"
      >
        Back to gallery
      </NuxtLink>
    </main>
  </div>
</template>
