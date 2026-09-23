<script setup lang="ts">
definePageMeta({
  ssr: false,
})

useHead({ title: 'Admin sign in · La Vida LOCA' })

const auth = useAdminAuth()

const username = ref('')
const pin = ref('')
const submitting = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  errorMsg.value = ''
  submitting.value = true

  try {
    await auth.loginWithUsername(username.value, pin.value)
    await navigateTo('/admin')
  }
  catch (error) {
    errorMsg.value = error instanceof Error ? error.message : 'That username or PIN is not right.'
  }
  finally {
    submitting.value = false
  }
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
        <label class="block">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink/70">Admin Username</span>
          <input
            v-model="username"
            type="text"
            name="username"
            required
            autocomplete="username"
            class="mt-1.5 w-full border border-cobalt-deep/20 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-cobalt-deep"
          >
        </label>

        <label class="mt-4 block">
          <span class="text-xs font-semibold uppercase tracking-wider text-ink/70">Admin Pin</span>
          <input
            v-model="pin"
            type="password"
            name="pin"
            required
            autocomplete="current-password"
            class="mt-1.5 w-full border border-cobalt-deep/20 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-cobalt-deep"
          >
        </label>

        <p
          v-if="errorMsg"
          class="mt-4 text-sm text-[#9c3048]"
          role="alert"
        >
          {{ errorMsg }}
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
