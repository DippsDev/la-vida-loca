<script setup lang="ts">
definePageMeta({
  pageTransition: {
    name: 'slide-to-rsvp',
    mode: 'out-in',
  },
})

useHead({ title: 'RSVP · La Vida LOCA' })

const supabase = useSupabaseClient()

const name = ref('')
const email = ref('')
const note = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

const emailOk = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
)

const canSubmit = computed(
  () => name.value.trim().length > 1 && emailOk.value && !submitting.value,
)

async function onSubmit() {
  errorMsg.value = ''

  if (!canSubmit.value) {
    errorMsg.value = 'Please enter a valid name and email.'
    return
  }

  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
    errorMsg.value = 'Supabase is not configured. Add your keys to .env.'
    return
  }

  submitting.value = true

  const { error } = await supabase.from('requests').insert({
    name: name.value.trim(),
    email: email.value.trim().toLowerCase(),
    note: note.value.trim() || null,
  })

  submitting.value = false

  if (error) {
    if (error.code === '23505') {
      errorMsg.value = 'You have already submitted a request.'
      return
    }
    errorMsg.value = error.message || 'Something went wrong. Please try again.'
    return
  }

  submitted.value = true
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <SiteNavbar />

    <div
      class="pointer-events-none absolute inset-0 bg-cobalt-deep/75 backdrop-blur-[2px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(11_61_145/0.45),transparent_55%),linear-gradient(to_top,rgb(7_42_102/0.85)_0%,transparent_55%)]"
      aria-hidden="true"
    />

    <main class="rsvp-main relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 pb-14 pt-28 sm:px-6">
      <p class="mb-5 text-center text-xs font-medium uppercase tracking-[0.22em] text-cream/90">
        Saturday · Private villa · By invitation
      </p>

      <Transition
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        mode="out-in"
      >
        <section
          v-if="submitted"
          key="success"
          class="rounded-sm bg-cream/95 px-8 py-10 text-center text-cobalt-deep backdrop-blur-sm"
        >
          <p class="font-script text-4xl text-cobalt">
            You’re on the list
          </p>
          <h2 class="mt-1 font-display text-2xl font-bold tracking-wide">
            Request received
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-cobalt-deep/75">
            We’ll review your request and email you if you’re approved. See you under the palms.
          </p>
        </section>

        <form
          v-else
          key="form"
          class="rounded-sm bg-cream/95 px-6 py-7 text-ink backdrop-blur-sm md:px-8"
          @submit.prevent="onSubmit"
        >
          <h1 class="font-display text-xl font-bold text-cobalt-deep">
            Request to Join
          </h1>
          <p class="mt-1 text-sm text-ink/65">
            Tell us who you are — we’ll take it from there.
          </p>

          <label class="mt-5 block text-xs font-semibold uppercase tracking-wider text-cobalt-deep">
            Full name
            <input
              v-model="name"
              type="text"
              required
              autocomplete="name"
              class="mt-2 w-full border border-cobalt-deep/25 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blossom"
            >
          </label>

          <label class="mt-4 block text-xs font-semibold uppercase tracking-wider text-cobalt-deep">
            Email
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="mt-2 w-full border border-cobalt-deep/25 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blossom"
            >
          </label>

          <label class="mt-4 block text-xs font-semibold uppercase tracking-wider text-cobalt-deep">
            Note to host
            <span class="font-normal normal-case tracking-normal text-ink/45"> (optional)</span>
            <textarea
              v-model="note"
              rows="2"
              class="mt-2 w-full resize-none border border-cobalt-deep/25 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blossom"
            />
          </label>

          <p
            v-if="errorMsg"
            class="mt-4 text-sm text-reject"
            role="alert"
          >
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            :disabled="!canSubmit"
            class="mt-5 w-full bg-blossom px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? 'Sending…' : 'Request to Join' }}
          </button>
        </form>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.rsvp-main :deep(form),
.rsvp-main :deep(section) {
  box-shadow: 0 18px 50px rgb(0 0 0 / 18%);
}
</style>
