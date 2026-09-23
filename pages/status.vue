<script setup lang="ts">
import type { JoinRequest } from '~/types/request'
import { partyDetails } from '~/utils/partyDetails'
import { downloadAcceptedTicket } from '~/utils/ticketDownload'

useHead({ title: 'Status · La Vida LOCA' })

const route = useRoute()
const supabase = useSupabaseClient()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const request = ref<JoinRequest | null>(null)
const looking = ref(false)
const looked = ref(false)
const downloading = ref(false)
const errorMsg = ref('')

const guestName = computed(() =>
  request.value ? `${request.value.first_name} ${request.value.surname}`.trim() : '',
)

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

async function lookup() {
  errorMsg.value = ''
  request.value = null
  looked.value = false

  if (!emailOk.value) {
    errorMsg.value = 'Enter the email you used on the RSVP.'
    return
  }

  looking.value = true

  if (!supabase) {
    looking.value = false
    errorMsg.value = 'We could not look up that email. Please try again.'
    return
  }

  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('email', email.value.trim().toLowerCase())
    .maybeSingle()

  looking.value = false
  looked.value = true

  if (error) {
    console.error(error)
    errorMsg.value = 'We could not look up that email. Please try again.'
    return
  }

  request.value = data
}

async function downloadTicket() {
  if (!request.value || request.value.status !== 'APPROVED' || downloading.value) return
  downloading.value = true
  errorMsg.value = ''
  try {
    await downloadAcceptedTicket(guestName.value, request.value.ticket_code)
  }
  catch (error) {
    console.error(error)
    errorMsg.value = 'The ticket could not be saved. Please try again.'
  }
  finally {
    downloading.value = false
  }
}

onMounted(() => {
  if (emailOk.value) void lookup()
})
</script>

<template>
  <div class="relative min-h-screen bg-cobalt-deep">
    <SiteNavbar />

    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgb(11_61_145/0.55),transparent_55%),linear-gradient(to_top,rgb(7_42_102)_0%,transparent_50%)]"
      aria-hidden="true"
    />

    <main class="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-16 pt-28 sm:px-6 lg:max-w-5xl">
      <p class="mx-auto w-full max-w-lg text-center text-xs font-medium uppercase tracking-[0.22em] text-cream/90">
        Your invitation
      </p>
      <h1 class="mx-auto mt-3 w-full max-w-lg text-center font-script text-5xl leading-none text-cream">
        Status
      </h1>

      <form
        class="mx-auto mt-8 w-full max-w-lg rounded-sm bg-cream/95 px-5 py-6 text-ink sm:px-7"
        @submit.prevent="lookup"
      >
        <label class="block text-xs font-semibold uppercase tracking-wider text-ink/60">
          Email
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="mt-2 w-full border-0 border-b border-ink/20 bg-transparent py-2 font-script text-2xl text-ink outline-none"
            placeholder="you@email.com"
          >
        </label>

        <p
          v-if="errorMsg"
          class="mt-3 text-sm text-reject"
          role="alert"
        >
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          class="mt-5 bg-cobalt-deep px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream disabled:opacity-50"
          :disabled="looking || !emailOk"
        >
          {{ looking ? 'Looking…' : 'Check status' }}
        </button>
      </form>

      <section
        v-if="request && request.status === 'PENDING'"
        class="mx-auto mt-8 w-full max-w-lg space-y-5"
      >
        <article class="rounded-sm bg-[#f4ead4] px-6 py-7 text-[#3a2414]">
          <p class="font-script text-4xl leading-none text-[#6a3014]">
            Still waiting
          </p>
          <p class="mt-4 font-script text-2xl leading-snug">
            Dear {{ request.first_name }},
          </p>
          <p class="mt-3 text-sm leading-relaxed">
            Your request is with the hosts. This ticket stays pending until they accept or decline it. The private details stay sealed until then.
          </p>
        </article>

        <EntryTicket
          :guest-name="guestName"
          :code="request.ticket_code"
          :accepted="false"
        />
      </section>

      <section
        v-else-if="request && request.status === 'APPROVED'"
        class="mt-8"
      >
        <div class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
        <article class="h-full rounded-sm bg-[#f4ead4] px-6 py-7 text-[#3a2414]">
          <p class="font-script text-4xl leading-none text-[#6a3014]">
            You are accepted
          </p>
          <p class="mt-4 font-script text-2xl leading-snug">
            Dear {{ request.first_name }},
          </p>
          <p class="mt-3 text-sm leading-relaxed">
            {{ partyDetails.day }}, {{ partyDetails.arrival.toLowerCase() }}. {{ partyDetails.place }}.
          </p>
          <p class="mt-3 text-sm leading-relaxed">
            {{ partyDetails.evening }}
          </p>
          <p class="mt-3 text-sm leading-relaxed">
            {{ partyDetails.idCheck }}
          </p>
        </article>

        <EntryTicket
          class="h-full"
          :guest-name="guestName"
          :code="request.ticket_code"
          :accepted="true"
        />
        </div>

        <button
          type="button"
          class="mt-5 w-full bg-cream px-4 py-3 text-xs font-semibold uppercase tracking-wider text-cobalt-deep disabled:opacity-50"
          :disabled="downloading"
          @click="downloadTicket"
        >
          {{ downloading ? 'Saving…' : 'Download image and PDF' }}
        </button>
      </section>

      <section
        v-else-if="request && request.status === 'REJECTED'"
        class="mx-auto mt-8 w-full max-w-lg"
      >
        <article class="rounded-sm bg-[#f4ead4] px-6 py-7 text-[#3a2414]">
          <p class="font-script text-4xl leading-none text-[#6a3014]">
            Not this time
          </p>
          <p class="mt-4 font-script text-2xl leading-snug">
            Dear {{ request.first_name }},
          </p>
          <p class="mt-3 text-sm leading-relaxed">
            We are sorry we cannot offer you a place at this party. Please come back for the ones still to come. We will send you word when the next gathering opens.
          </p>
        </article>
      </section>

      <p
        v-else-if="looked && !errorMsg"
        class="mx-auto mt-8 w-full max-w-lg text-center text-sm text-cream/80"
      >
        We do not have a request under that email.
      </p>
    </main>
  </div>
</template>
