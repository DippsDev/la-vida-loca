<script setup lang="ts">
type Phase = 'closed' | 'opening' | 'open' | 'sealing' | 'closing' | 'sending' | 'sent'

const emit = defineEmits<{ sent: [] }>()

const phase = ref<Phase>('closed')
const cardEl = ref<HTMLElement | null>(null)

let timers: number[] = []
let alive = true

const liveMessage = computed(() => {
  if (phase.value === 'sealing' || phase.value === 'closing' || phase.value === 'sending') {
    return 'Sending your letter.'
  }
  if (phase.value === 'sent') return 'Your letter is on its way.'
  return ''
})

const letterVisible = computed(() =>
  phase.value === 'open' || phase.value === 'sealing' || phase.value === 'closing' || phase.value === 'sending',
)

const isTucking = computed(() =>
  phase.value === 'sealing' || phase.value === 'closing' || phase.value === 'sending',
)

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function later(ms: number, fn: () => void) {
  const id = window.setTimeout(() => {
    if (!alive) return
    fn()
  }, ms)
  timers.push(id)
}

function clearTimers() {
  timers.forEach(id => window.clearTimeout(id))
  timers = []
}

function openInvite() {
  if (phase.value !== 'closed') return
  phase.value = 'opening'

  later(reducedMotion() ? 0 : 1320, async () => {
    phase.value = 'open'
    await nextTick()
    cardEl.value?.querySelector<HTMLInputElement>('input')?.focus()
  })
}

function finishSent() {
  phase.value = 'sent'
  emit('sent')
}

function send() {
  return new Promise<void>((resolve) => {
    if (phase.value === 'sent') {
      resolve()
      return
    }

    clearTimers()
    cardEl.value?.querySelector<HTMLElement>('input, textarea, button')?.blur()

    if (reducedMotion() || phase.value !== 'open') {
      finishSent()
      resolve()
      return
    }

    phase.value = 'sealing'
    cardEl.value?.closest('.invite')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    later(860, () => {
      phase.value = 'closing'
    })
    later(1720, () => {
      phase.value = 'sending'
    })
    later(2860, () => {
      finishSent()
      resolve()
    })
  })
}

defineExpose({ send })

onBeforeUnmount(() => {
  alive = false
  clearTimers()
})
</script>

<template>
  <div
    class="invite"
    :class="{ 'is-tucking': isTucking }"
    :data-phase="phase"
  >
    <p
      class="sr-only"
      aria-live="polite"
    >
      {{ liveMessage }}
    </p>

    <div
      v-if="phase !== 'sent'"
      class="invite-stage"
    >
      <div class="pocket">
        <div class="envelope">
          <span class="envelope__scene">
            <span class="envelope__back" />
            <span class="envelope__folds" />
            <span class="envelope__interior" />
            <span class="envelope__mark">
              <span class="font-script text-[2.65rem] leading-none text-cobalt-deep">La Vida</span>
              <span class="mt-1 block text-[11px] font-semibold uppercase tracking-[0.28em] text-cobalt-deep/70">RSVP</span>
            </span>
            <span class="envelope__flap">
              <span class="envelope__flap-face envelope__flap-front" />
              <span class="envelope__seal">L</span>
            </span>
          </span>

          <button
            v-if="phase === 'closed' || phase === 'opening'"
            type="button"
            class="envelope__open"
            :disabled="phase !== 'closed'"
            aria-label="Open the invitation"
            @click="openInvite"
          />
        </div>
      </div>

      <p
        v-if="phase === 'closed' || phase === 'opening'"
        class="envelope__hint"
      >
        Press to open
      </p>

      <div
        v-show="letterVisible"
        ref="cardEl"
        class="letter"
      >
        <slot />
      </div>
    </div>

    <div
      v-else
      class="aftermath"
    >
      <slot name="sent" />
    </div>
  </div>
</template>

<style scoped>
.invite {
  width: 100%;
  min-height: 28rem;
  margin-top: 4rem;
}

@media (max-width: 639px) {
  .invite {
    margin-top: 2.75rem;
  }
}

.invite-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.pocket {
  width: min(100%, 24rem);
}

.invite[data-phase="open"] .pocket,
.invite[data-phase="sealing"] .pocket,
.invite[data-phase="closing"] .pocket,
.invite[data-phase="sending"] .pocket {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 2;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.invite[data-phase="closing"] .pocket,
.invite[data-phase="sending"] .pocket {
  z-index: 5;
}

.envelope {
  position: relative;
  display: block;
  width: 100%;
}

.envelope__open {
  position: absolute;
  inset: 0;
  z-index: 6;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.envelope__open:disabled {
  cursor: default;
}

.envelope__open:focus {
  outline: none;
}

.envelope__open:focus-visible {
  outline: 1px solid rgb(245 240 230 / 0.75);
  outline-offset: 8px;
}

.envelope__scene {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 8 / 5;
  perspective: 1100px;
}

.envelope__back,
.envelope__folds,
.envelope__interior,
.envelope__mark,
.envelope__flap {
  position: absolute;
}

.envelope__back {
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, #f8f3ea 0%, #efe4d4 100%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.75),
    0 22px 48px rgb(0 0 0 / 0.26);
  transition: box-shadow 400ms ease;
}

.envelope__folds {
  inset: 0;
  z-index: 3;
  background:
    linear-gradient(to top right, transparent calc(50% - 0.5px), rgb(11 61 145 / 0.16) 50%, transparent calc(50% + 0.5px)),
    linear-gradient(to top left, transparent calc(50% - 0.5px), rgb(11 61 145 / 0.16) 50%, transparent calc(50% + 0.5px));
  clip-path: inset(50% 0 0 0);
  pointer-events: none;
}

.pocket:has(.envelope__open:hover:not(:disabled)) .envelope__back {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.75),
    0 28px 56px rgb(0 0 0 / 0.34);
}

.envelope__interior {
  z-index: 2;
  top: 0;
  right: 0;
  left: 0;
  height: 50%;
  background: linear-gradient(180deg, #041433 0%, #0a326e 100%);
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.envelope__mark {
  z-index: 4;
  right: 12%;
  bottom: 9%;
  left: 12%;
  text-align: center;
  pointer-events: none;
}

.envelope__flap {
  z-index: 5;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  transform-origin: center top;
  transform-style: preserve-3d;
}

.envelope__flap-face {
  position: absolute;
  inset: 0;
  clip-path: polygon(0 0, 100% 0, 50% 100%);
}

.envelope__flap-front {
  background: linear-gradient(180deg, #fbf8f2 0%, #f4ecdf 100%);
  filter: drop-shadow(0 10px 8px rgb(7 42 102 / 0.08));
}

.envelope__seal {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 0;
  display: grid;
  width: 3.35rem;
  height: 3.35rem;
  margin: 0 0 -1.35rem -1.675rem;
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
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.envelope__hint {
  display: block;
  margin-top: 1.35rem;
  color: rgb(245 240 230 / 0.72);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.24em;
  text-align: center;
  text-transform: uppercase;
  animation: hint-pulse 2.6s ease-in-out infinite;
}

@media (max-width: 639px) {
  .envelope__seal {
    margin-bottom: -0.55rem;
  }

  .envelope__mark {
    bottom: 5%;
  }
}

.invite[data-phase="opening"] .envelope {
  pointer-events: none;
  animation: envelope-away 0.4s 0.92s ease forwards;
}

.invite[data-phase="opening"] .envelope__flap {
  animation: flap-open 0.9s cubic-bezier(0.45, 0.02, 0.2, 1) forwards;
}

.invite[data-phase="opening"] .envelope__hint {
  animation: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.invite[data-phase="open"] .envelope {
  opacity: 0;
}

.letter {
  width: 100%;
}

.invite[data-phase="open"] .letter {
  animation: letter-rise 560ms cubic-bezier(0.22, 1, 0.36, 1);
}

.invite[data-phase="sealing"] .envelope,
.invite[data-phase="closing"] .envelope,
.invite[data-phase="sending"] .envelope {
  opacity: 1;
}

.invite[data-phase="sealing"] .envelope {
  animation: envelope-return 0.34s ease both;
}

.invite[data-phase="sealing"] .envelope__flap,
.invite[data-phase="closing"] .envelope__flap {
  transform: rotateX(122deg);
}

.invite.is-tucking .letter {
  position: relative;
  z-index: 4;
  transform-origin: center center;
  pointer-events: none;
  animation: letter-tuck 1.05s cubic-bezier(0.55, 0.02, 0.25, 1) forwards;
}

.invite[data-phase="closing"] .letter,
.invite[data-phase="sending"] .letter {
  z-index: 1;
}

.invite[data-phase="closing"] .envelope__flap {
  animation: flap-close 0.72s cubic-bezier(0.45, 0.02, 0.2, 1) forwards;
}

.invite[data-phase="sending"] .letter {
  visibility: hidden;
}

.invite[data-phase="sending"] .envelope {
  animation: post-letter 1.08s cubic-bezier(0.4, 0.02, 0.2, 1) forwards;
}

.aftermath {
  animation: letter-rise 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes flap-open {
  from { transform: rotateX(0deg); }
  to { transform: rotateX(122deg); }
}

@keyframes flap-close {
  from { transform: rotateX(122deg); }
  to { transform: rotateX(0deg); }
}

@keyframes envelope-away {
  to { opacity: 0; }
}

@keyframes envelope-return {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes letter-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes letter-tuck {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }

  46% {
    transform: translateY(5%) scale(0.6);
    opacity: 1;
  }

  82% {
    transform: translateY(14%) scale(0.34);
    opacity: 0;
  }

  100% {
    transform: translateY(16%) scale(0.26);
    opacity: 0;
  }
}

@keyframes post-letter {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
    opacity: 1;
  }

  22% {
    transform: translate3d(0.35rem, -1.15rem, 0) rotate(-4deg) scale(1.03);
    opacity: 1;
  }

  68% {
    opacity: 1;
  }

  100% {
    transform: translate3d(34vw, -62vh, 0) rotate(-14deg) scale(0.92);
    opacity: 0;
  }
}

@keyframes hint-pulse {
  0%,
  100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .envelope__hint,
  .invite[data-phase="opening"] .envelope,
  .invite[data-phase="opening"] .envelope__flap,
  .invite[data-phase="sealing"] .letter,
  .invite[data-phase="closing"] .letter,
  .invite[data-phase="closing"] .envelope__flap,
  .invite[data-phase="sending"] .envelope,
  .invite[data-phase="open"] .letter,
  .aftermath {
    animation: none;
  }
}
</style>
