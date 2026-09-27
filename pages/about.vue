<script setup lang="ts">
useHead({ title: 'About · La Vida Loca' })

const supabase = useSupabaseClient()

type Desk = 'legal' | 'feedback' | 'bug'

const desk = ref<Desk | null>(null)
const body = ref('')
const email = ref('')
const sending = ref(false)
const sent = ref(false)
const errorMsg = ref('')

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const canSend = computed(() => body.value.trim().length > 0 && body.value.trim().length <= 1000 && !sending.value && (email.value.trim() === '' || emailOk.value))

const deskCopy = {
  feedback: {
    label: 'Feedback',
    lead: 'A note about the weekend, the house, or this site.',
    placeholder: 'What you would like the hosts to know',
  },
  bug: {
    label: 'Report a bug',
    lead: 'If a page stalled or a button did nothing, say where you were and what you saw.',
    placeholder: 'The page, and what happened',
  },
} as const

function openDesk(next: Desk) {
  errorMsg.value = ''
  if (desk.value === next) {
    desk.value = null
    return
  }
  desk.value = next
  body.value = ''
  email.value = ''
  sent.value = false
}

async function sendNote() {
  if (!desk.value || desk.value === 'legal' || !canSend.value) return
  errorMsg.value = ''

  if (!supabase) {
    errorMsg.value = 'That note could not be sent. Please try again.'
    return
  }

  sending.value = true
  const { error } = await supabase.from('house_notes').insert({
    kind: desk.value,
    body: body.value.trim(),
    email: email.value.trim() || null,
  })
  sending.value = false

  if (error) {
    console.error(error)
    errorMsg.value = 'That note could not be sent. Please try again.'
    return
  }

  sent.value = true
  body.value = ''
  email.value = ''
}
</script>

<template>
  <div class="relative flex min-h-dvh flex-col overflow-hidden bg-cobalt-deep">
    <SiteNavbar />

    <main class="relative z-10 mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
      <p class="text-center text-xs font-medium uppercase tracking-[0.22em] text-cream/80">
        About the experience
      </p>

      <h1 class="mt-4 text-center font-script text-5xl leading-none text-cream sm:text-6xl">
        La Vida Loca
      </h1>

      <div class="mt-10 space-y-6 rounded-sm bg-cream/95 px-6 py-8 text-ink backdrop-blur-sm sm:px-9 sm:py-10">
        <p class="text-sm leading-relaxed sm:text-base">
          La Vida Loca is a private, invitation-only gathering — a weekend shaped around good company,
          slow mornings, and nights that stretch a little longer than planned. This site is the digital
          front door: a place to explore the mood, browse the gallery, and request your spot.
        </p>

        <p class="text-sm leading-relaxed text-ink/75 sm:text-base">
          The spinning gallery is a living collage of the villa, the coast, and the people who make the
          weekend what it is. Tap through the tiles, linger on a moment, and get a feel for the energy
          before you RSVP.
        </p>

        <p class="text-sm leading-relaxed text-ink/75 sm:text-base">
          Requests are reviewed by the hosts. Once approved, guests receive the details they need — location,
          schedule, and the small rituals that turn a house into a home for a few days.
        </p>

        <div class="flex flex-wrap gap-3 pt-2">
          <NuxtLink
            to="/gallery"
            class="rounded-sm bg-cobalt-deep px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition hover:brightness-110"
          >
            View gallery
          </NuxtLink>
          <NuxtLink
            to="/rsvp"
            class="rounded-sm border border-cobalt-deep/30 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cobalt-deep transition hover:border-cobalt-deep hover:bg-cobalt-deep/5"
          >
            Request invite
          </NuxtLink>
        </div>
      </div>
    </main>

    <footer class="relative z-10 mt-auto border-t border-cream/15">
      <div class="mx-auto max-w-2xl px-5 pb-[max(2.25rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pt-10">
        <nav
          class="flex flex-wrap items-center justify-center gap-x-7 gap-y-3"
          aria-label="House desk"
        >
          <button
            type="button"
            class="text-xs font-semibold uppercase tracking-wider transition"
            :class="desk === 'legal' ? 'text-cream' : 'text-cream/55 hover:text-cream'"
            :aria-expanded="desk === 'legal'"
            aria-controls="house-desk"
            @click="openDesk('legal')"
          >
            Legal pack
          </button>
          <button
            type="button"
            class="text-xs font-semibold uppercase tracking-wider transition"
            :class="desk === 'feedback' ? 'text-cream' : 'text-cream/55 hover:text-cream'"
            :aria-expanded="desk === 'feedback'"
            aria-controls="house-desk"
            @click="openDesk('feedback')"
          >
            Feedback
          </button>
          <button
            type="button"
            class="text-xs font-semibold uppercase tracking-wider transition"
            :class="desk === 'bug' ? 'text-cream' : 'text-cream/55 hover:text-cream'"
            :aria-expanded="desk === 'bug'"
            aria-controls="house-desk"
            @click="openDesk('bug')"
          >
            Report a bug
          </button>
        </nav>

        <div
          v-if="desk"
          id="house-desk"
          class="mx-auto mt-8 max-w-md"
        >
          <div
            v-if="desk === 'legal'"
            class="space-y-5 text-sm leading-relaxed text-cream/75"
          >
            <p>
              <span class="mb-1 block text-[0.65rem] font-medium uppercase tracking-[0.18em] text-cream/45">The gathering</span>
              La Vida Loca is a private, invitation-only weekend. An RSVP asks for a place. It becomes one only when the hosts accept it.
            </p>
            <p>
              <span class="mb-1 block text-[0.65rem] font-medium uppercase tracking-[0.18em] text-cream/45">Your details</span>
              The name, email, phone, and age on a request are used to review it, write back, and check the door. They are not published on this site.
            </p>
            <p>
              <span class="mb-1 block text-[0.65rem] font-medium uppercase tracking-[0.18em] text-cream/45">The gallery</span>
              Pictures and film here belong to the weekend. Please leave them on this site.
            </p>
          </div>

          <form
            v-else
            class="text-left"
            @submit.prevent="sendNote"
          >
            <p class="text-sm leading-relaxed text-cream/75">
              {{ deskCopy[desk].lead }}
            </p>

            <p
              v-if="sent"
              class="mt-5 text-sm text-cream"
              role="status"
            >
              Received. The hosts have it.
            </p>

            <template v-else>
              <label class="mt-5 block">
                <span class="sr-only">{{ deskCopy[desk].label }}</span>
                <textarea
                  v-model="body"
                  rows="4"
                  maxlength="1000"
                  required
                  class="w-full resize-none rounded-sm border border-cream/20 bg-transparent px-3 py-3 text-sm leading-relaxed text-cream outline-none placeholder:text-cream/35 focus:border-cream/55"
                  :placeholder="deskCopy[desk].placeholder"
                />
              </label>
              <label class="mt-3 block">
                <span class="sr-only">Email, if you want a reply</span>
                <input
                  v-model="email"
                  type="email"
                  inputmode="email"
                  autocomplete="email"
                  maxlength="120"
                  class="w-full rounded-sm border border-cream/20 bg-transparent px-3 py-2.5 text-sm text-cream outline-none placeholder:text-cream/35 focus:border-cream/55"
                  placeholder="Email, if you want a reply"
                >
              </label>
              <p
                v-if="errorMsg"
                class="mt-3 text-sm text-cream"
                role="alert"
              >
                {{ errorMsg }}
              </p>
              <button
                type="submit"
                class="mt-4 rounded-sm border border-cream/35 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition hover:bg-cream hover:text-cobalt-deep disabled:opacity-40"
                :disabled="!canSend"
              >
                {{ sending ? 'Sending…' : 'Send' }}
              </button>
            </template>
          </form>
        </div>

        <img
          src="/logo-l.png"
          alt="La Vida Loca"
          class="mx-auto mt-10 h-36 w-36 object-contain mix-blend-lighten"
        >
      </div>
    </footer>
  </div>
</template>
