<script setup lang="ts">
useHead({ title: 'RSVP · La Vida Loca' })

const supabase = useSupabaseClient()

const name = ref('')
const surname = ref('')
const email = ref('')
const phone = ref('')
const age = ref('')
const extra = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const invite = ref<{ send: () => Promise<void> } | null>(null)

const phoneDigits = computed(() => phone.value.replace(/\D/g, ''))

const emailOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))

const ageOk = computed(() => {
  if (!/^\d{1,3}$/.test(age.value.trim())) return false
  const years = Number(age.value.trim())
  return years >= 1 && years <= 120
})

const canSubmit = computed(
  () => name.value.trim().length > 0
    && surname.value.trim().length > 0
    && emailOk.value
    && phoneDigits.value.length >= 7
    && ageOk.value
    && !submitting.value,
)

function requestErrorMessage(error: { code?: string, message?: string, details?: string | null }) {
  const text = `${error.message ?? ''} ${error.details ?? ''}`
  if (error.code === '23505' && (text.includes('requests_email_lower_idx') || text.includes('lower(email)'))) {
    return 'This email already has a request. Check Status to see it.'
  }
  if (error.code === '23505' && text.includes('requests_phone_digits_idx')) {
    return 'This phone number already has a request.'
  }
  if (error.code === '23514') {
    return 'Please check your name, email, phone number, and age.'
  }
  return 'We could not send your letter. Please try again.'
}

async function onSubmit() {
  errorMsg.value = ''

  if (!canSubmit.value) {
    errorMsg.value = 'Add your name, surname, email, phone number, and age.'
    return
  }

  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
    errorMsg.value = 'We could not send your letter just now. Please try again later.'
    return
  }

  submitting.value = true

  if (!supabase) {
    submitting.value = false
    errorMsg.value = 'We could not send your letter just now. Please try again later.'
    return
  }

  const { error } = await supabase.from('requests').insert({
    first_name: name.value.trim(),
    surname: surname.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    age: Number(age.value.trim()),
    note: extra.value.trim() || null,
  })

  if (error) {
    submitting.value = false
    console.error(error)
    errorMsg.value = requestErrorMessage(error)
    return
  }

  await invite.value?.send()
  submitting.value = false
}
</script>

<template>
  <div class="relative min-h-screen bg-cobalt-deep">
    <svg class="paper-tear-def" width="0" height="0" aria-hidden="true">
      <defs>
        <clipPath id="paper-tear" clipPathUnits="objectBoundingBox">
          <path d="M0 0.028C0.014 0.028 0.028 0.016 0.04 0.016C0.051 0.016 0.061 0.034 0.07 0.034C0.084 0.034 0.098 0.018 0.11 0.018C0.124 0.018 0.138 0.012 0.15 0.012C0.164 0.012 0.178 0.026 0.19 0.026C0.207 0.026 0.225 0.014 0.24 0.014C0.258 0.014 0.275 0.008 0.29 0.008C0.307 0.008 0.325 0.022 0.34 0.022C0.361 0.022 0.382 0.032 0.4 0.032C0.421 0.032 0.442 0.014 0.46 0.014C0.481 0.014 0.502 0.01 0.52 0.01C0.537 0.01 0.555 0.024 0.57 0.024C0.591 0.024 0.612 0.012 0.63 0.012C0.647 0.012 0.665 0.03 0.68 0.03C0.701 0.03 0.722 0.016 0.74 0.016C0.761 0.016 0.782 0.009 0.8 0.009C0.821 0.009 0.842 0.022 0.86 0.022C0.881 0.022 0.902 0.014 0.92 0.014C0.938 0.014 0.955 0.026 0.97 0.026C0.98 0.026 0.991 0.018 1 0.018L1 1L0 1Z" />
        </clipPath>
      </defs>
    </svg>
    <SiteNavbar />

    <main class="rsvp-main relative z-10 mx-auto flex max-w-lg flex-col px-5 sm:min-h-dvh sm:px-6">
      <p class="rsvp-kicker text-center text-xs font-medium uppercase tracking-[0.22em] text-cream/90">
        Saturday · Private villa · By invitation
      </p>

      <RsvpEnvelope ref="invite">
        <form
          class="notebook"
          @submit.prevent="onSubmit"
        >
          <div class="notebook__sheet">
            <p class="notebook__script">
              RSVP
            </p>
            <p class="notebook__type notebook__type--quiet">
              Saturday · private villa
            </p>

            <label class="rule">
              <span class="rule__label">Name</span>
              <input
                v-model="name"
                type="text"
                required
                autocomplete="given-name"
                class="rule__write"
                placeholder="your name"
              >
            </label>

            <label class="rule">
              <span class="rule__label">Surname</span>
              <input
                v-model="surname"
                type="text"
                required
                autocomplete="family-name"
                class="rule__write"
                placeholder="your surname"
              >
            </label>

            <label class="rule">
              <span class="rule__label">Email</span>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                inputmode="email"
                class="rule__write"
                placeholder="you@email.com"
              >
            </label>

            <label class="rule">
              <span class="rule__label">Phone</span>
              <input
                v-model="phone"
                type="tel"
                required
                autocomplete="tel"
                inputmode="tel"
                class="rule__write"
                placeholder="+267 71 234 567"
              >
            </label>

            <label class="rule">
              <span class="rule__label">Age</span>
              <input
                v-model="age"
                type="text"
                required
                inputmode="numeric"
                maxlength="3"
                class="rule__write"
                placeholder="years"
              >
            </label>

            <label class="extra">
              <span class="rule__label rule__label--block">Extra info <span class="rule__optional">(optional)</span></span>
              <textarea
                v-model="extra"
                rows="3"
                class="extra__write"
                placeholder="anything else"
              />
            </label>

            <p
              v-if="errorMsg"
              class="notebook__error"
              role="alert"
            >
              {{ errorMsg }}
            </p>

            <div class="rule rule--end">
              <button
                type="submit"
                class="send"
                :disabled="!canSubmit"
              >
                {{ submitting ? 'Sending…' : 'Send' }}
              </button>
            </div>
          </div>
        </form>

        <template #sent>
          <div class="posted">
            <span class="posted__seal" aria-hidden="true">L</span>
            <p class="posted__script">
              On its way
            </p>
            <p class="posted__hand">
              Dear {{ name.trim() }}, we have your note. Your ticket stays pending until the hosts accept or decline it.
            </p>
            <NuxtLink
              :to="{ path: '/status', query: { email: email.trim() } }"
              class="posted__go"
            >
              Check your status
            </NuxtLink>
          </div>
        </template>
      </RsvpEnvelope>
    </main>
  </div>
</template>

<style scoped>
.paper-tear-def {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.rsvp-kicker {
  margin-bottom: 4.5rem;
}

.rsvp-main {
  justify-content: flex-start;
  min-height: 100dvh;
  padding-top: calc(7.5rem + env(safe-area-inset-top, 0px));
  /* Room to scroll Send clear of the iPhone home indicator and Safari bar. */
  padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0px));
  scroll-padding-bottom: calc(2.5rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 640px) {
  .rsvp-kicker {
    margin-bottom: 1.25rem;
  }

  .rsvp-main {
    justify-content: safe center;
    padding-top: 7rem;
    padding-bottom: calc(4.5rem + env(safe-area-inset-bottom, 0px));
  }
}

.notebook {
  --rule: 2.05rem;
  --ink: #3a2414;
  position: relative;
  isolation: isolate;
  color: var(--ink);
  background-color: #f4ead4;
  background-image:
    radial-gradient(ellipse at 12% 18%, rgb(196 154 92 / 0.35), transparent 42%),
    radial-gradient(ellipse at 86% 8%, rgb(168 122 72 / 0.22), transparent 36%),
    radial-gradient(ellipse at 74% 82%, rgb(120 72 28 / 0.16), transparent 46%);
  filter:
    drop-shadow(0 12px 18px rgb(18 6 0 / 0.38))
    drop-shadow(0 26px 36px rgb(8 2 0 / 0.32));
  clip-path: url("#paper-tear");
  transform: rotate(-0.35deg);
}

.notebook::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgb(110 62 22 / 0.34), rgb(110 62 22 / 0.08) 14px, transparent 28px),
    radial-gradient(ellipse at 100% 100%, rgb(80 36 10 / 0.22) 0%, transparent 26%),
    radial-gradient(ellipse at 0% 100%, rgb(80 36 10 / 0.2) 0%, transparent 24%),
    linear-gradient(to bottom, transparent 70%, rgb(80 40 14 / 0.14)),
    linear-gradient(to right, rgb(80 40 14 / 0.1), transparent 6%, transparent 94%, rgb(80 40 14 / 0.1));
  box-shadow: inset 0 0 18px 2px rgb(90 40 10 / 0.12);
}

.notebook__sheet {
  position: relative;
  z-index: 2;
  padding: 1.35rem 1.15rem 1.35rem;
}

.notebook__script {
  display: flex;
  align-items: flex-end;
  height: calc(var(--rule) * 2);
  margin: 0;
  padding-bottom: 0.15rem;
  font-family: Italianno, cursive;
  font-size: 3.4rem;
  line-height: 0.8;
  color: #6a3014;
}

.notebook__script--center {
  justify-content: center;
}

.notebook__type {
  display: flex;
  align-items: flex-end;
  height: var(--rule);
  margin: 0;
  padding-bottom: 0.28rem;
  font-family: "Courier Prime", ui-monospace, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: rgb(74 48 28 / 0.78);
}

.notebook__type--quiet {
  color: rgb(74 48 28 / 0.58);
}

.notebook__type--center {
  justify-content: center;
}

.notebook__hand {
  margin: 0;
  font-family: Caveat, cursive;
  font-size: 1.55rem;
  font-weight: 500;
  line-height: var(--rule);
  color: var(--ink);
}

.notebook__hand--note {
  height: calc(var(--rule) * 3);
  text-align: center;
}

.rule,
.extra__write,
.rule--end {
  min-height: var(--rule);
}

.rule {
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  height: var(--rule);
  margin: 0;
}

.rule.rule--end {
  justify-content: flex-end;
  height: auto;
  min-height: 2.75rem;
  /* Caveat draws past the button box. Keep the swash and underline inside the paper. */
  padding: 0.55rem 2.6rem 1.35rem 0.4rem;
  overflow: visible;
}

.rule__label {
  flex: none;
  padding-bottom: 0.28rem;
  font-family: "Courier Prime", ui-monospace, monospace;
  font-size: 0.74rem;
  letter-spacing: 0.01em;
  color: rgb(74 48 28 / 0.82);
}

.rule__label--block {
  display: flex;
  align-items: flex-end;
  height: var(--rule);
}

.rule__write,
.extra__write {
  width: 100%;
  margin: 0;
  padding: 0 0 0.12rem;
  border: 0;
  background: transparent;
  color: var(--ink);
  font-family: Caveat, cursive;
  font-size: 1.55rem;
  font-weight: 500;
  line-height: 1;
  outline: none;
}

.rule__write {
  flex: 1;
  min-width: 0;
  height: var(--rule);
}

.rule__write::placeholder,
.extra__write::placeholder {
  color: rgb(74 48 28 / 0.34);
}

.rule__optional {
  font-style: italic;
}

.extra {
  display: block;
  margin: 0;
}

.extra__write {
  display: block;
  box-sizing: border-box;
  height: 4.6rem;
  resize: none;
  line-height: 1.45;
  padding: 0.15rem 0 0;
}

.notebook__error {
  display: block;
  height: auto;
  margin: 0.15rem 0 0.2rem;
  color: #9c3048;
  font-family: Caveat, cursive;
  font-size: 1.45rem;
  font-weight: 500;
  line-height: 1.25;
}

.send {
  margin: 0;
  padding: 0.15rem 0.45rem 0.55rem;
  border: 0;
  background: transparent;
  color: #5c2c12;
  font-family: Caveat, cursive;
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.35;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18rem;
  cursor: pointer;
  overflow: visible;
  scroll-margin-bottom: calc(2.5rem + env(safe-area-inset-bottom, 0px));
}

.send:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}

.rule__write:-webkit-autofill,
.extra__write:-webkit-autofill {
  -webkit-text-fill-color: var(--ink);
  box-shadow: 0 0 0 1000px #f3e7cf inset;
}

.posted {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 2.5rem;
  text-align: center;
  color: #f5f0e6;
}

.posted__seal {
  display: grid;
  width: 3.35rem;
  height: 3.35rem;
  place-items: center;
  border-radius: 999px;
  background: radial-gradient(circle at 34% 30%, #7aa6e8 0%, #0b3d91 46%, #072a66 100%);
  box-shadow:
    inset 0 0 0 1.5px rgb(245 240 230 / 0.55),
    inset 0 0 0 6px rgb(11 61 145 / 0.2),
    0 8px 16px rgb(7 42 102 / 0.35);
  color: #f5f0e6;
  font-family: Italianno, cursive;
  font-size: 2.05rem;
  line-height: 1;
  padding-top: 0.28rem;
}

.posted__script {
  margin: 1.1rem 0 0;
  font-family: Italianno, cursive;
  font-size: 4.4rem;
  line-height: 0.8;
}

.posted__hand {
  max-width: 22rem;
  margin: 0.85rem 0 0;
  font-family: Caveat, cursive;
  font-size: 1.7rem;
  font-weight: 500;
  line-height: 1.35;
}

.posted__go {
  margin-top: 1.35rem;
  font-family: Caveat, cursive;
  font-size: 1.7rem;
  font-weight: 600;
  color: #f5f0e6;
  text-decoration: underline;
  text-underline-offset: 0.18rem;
}
</style>
