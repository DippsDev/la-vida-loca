<script setup lang="ts">
import { partyDetails } from '~/utils/partyDetails'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  guestName: string
  code: string
  accepted: boolean
}>()

const ticketLabel = computed(() =>
  props.accepted
    ? `Accepted entry ticket for ${props.guestName}`
    : `Pending entry ticket for ${props.guestName}`,
)

const sourceEl = ref<HTMLButtonElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const dimEl = ref<HTMLElement | null>(null)
const closeEl = ref<HTMLButtonElement | null>(null)
const shown = ref(false)
const stageStyle = ref<Record<string, string>>({})

const DURATION = 720
const EASE_OPEN = 'cubic-bezier(0.45, 0, 0.55, 1)'

let motion: Animation | null = null
let veilMotion: Animation | null = null
let closeMotion: Animation | null = null
let closing = false
let cancelOpen = false
let scrollPad = ''

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function lockPage() {
  const gap = window.innerWidth - document.documentElement.clientWidth
  scrollPad = document.body.style.paddingRight
  document.body.style.overflow = 'hidden'
  if (gap > 0) document.body.style.paddingRight = `${gap}px`
}

function unlockPage() {
  document.body.style.overflow = ''
  document.body.style.paddingRight = scrollPad
}

function liftFor(source: DOMRect) {
  const maxW = Math.min(window.innerWidth - 36, 680)
  const maxH = window.innerHeight - 96
  const fit = Math.min(maxW / source.width, maxH / source.height)
  return Math.max(1, fit)
}

function poseOver(source: DOMRect, layout: DOMRect, lift: number) {
  const scale = 1 / lift
  const dx = (source.left + source.width / 2) - (layout.left + layout.width / 2)
  const dy = (source.top + source.height / 2) - (layout.top + layout.height / 2)
  return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`
}

function clearMotions() {
  motion?.cancel()
  veilMotion?.cancel()
  closeMotion?.cancel()
  motion = null
  veilMotion = null
  closeMotion = null
}

function settleClosed() {
  clearMotions()
  closing = false
  cancelOpen = false
  sourceEl.value?.classList.remove('ticket--held')
  shown.value = false
  stageStyle.value = {}
  unlockPage()
}

async function openTicket() {
  if (shown.value || !sourceEl.value) return
  cancelOpen = false
  lockPage()

  const source = sourceEl.value.getBoundingClientRect()
  const lift = liftFor(source)
  stageStyle.value = {
    width: `${source.width * lift}px`,
    '--lift': String(lift),
  }
  shown.value = true
  await nextTick()

  const el = stageEl.value
  const dim = dimEl.value
  if (cancelOpen || !el || !dim || !sourceEl.value) {
    settleClosed()
    return
  }

  if (prefersReducedMotion()) {
    sourceEl.value.classList.add('ticket--held')
    dim.style.opacity = '1'
    if (closeEl.value) closeEl.value.style.opacity = '1'
    closeEl.value?.focus({ preventScroll: true })
    return
  }

  const from = poseOver(source, el.getBoundingClientRect(), lift)
  el.style.transform = from
  sourceEl.value.classList.add('ticket--held')

  motion = el.animate(
    [{ transform: from }, { transform: 'translate3d(0px, 0px, 0px) scale(1)' }],
    { duration: DURATION, easing: EASE_OPEN, fill: 'both' },
  )
  veilMotion = dim.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: DURATION, easing: EASE_OPEN, fill: 'both' },
  )
  if (closeEl.value) {
    closeMotion = closeEl.value.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: DURATION, easing: EASE_OPEN, fill: 'both' },
    )
  }

  const opening = motion
  try {
    await opening.finished
  }
  catch {
    return
  }
  if (opening.playbackRate < 0 || closing) return
  closeEl.value?.focus({ preventScroll: true })
}

async function closeTicket() {
  if (!shown.value || closing) {
    cancelOpen = true
    return
  }

  if (!motion || prefersReducedMotion()) {
    settleClosed()
    sourceEl.value?.focus({ preventScroll: true })
    return
  }

  closing = true
  motion.reverse()
  veilMotion?.reverse()
  closeMotion?.reverse()

  const closingMotion = motion
  try {
    await closingMotion.finished
  }
  catch {
    closing = false
    return
  }

  sourceEl.value?.classList.remove('ticket--held')
  shown.value = false
  stageStyle.value = {}
  clearMotions()
  closing = false
  unlockPage()
  sourceEl.value?.focus({ preventScroll: true })
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && shown.value) closeTicket()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearMotions()
  if (import.meta.client) unlockPage()
})
</script>

<template>
  <button
    ref="sourceEl"
    v-bind="$attrs"
    type="button"
    class="ticket"
    :aria-label="ticketLabel"
    aria-haspopup="dialog"
    :aria-expanded="shown"
    @click="openTicket"
  >
    <div class="ticket__main">
      <p class="ticket__brand">
        La Vida Loca
      </p>
      <p class="ticket__kicker">
        {{ accepted ? 'Accepted' : 'Pending' }}
      </p>
      <p class="ticket__name">
        {{ guestName }}
      </p>
      <p class="ticket__meta">
        {{ code }}
      </p>

      <template v-if="accepted">
        <p class="ticket__meta">
          {{ partyDetails.day }} · {{ partyDetails.arrival }}
        </p>
        <p class="ticket__meta">
          {{ partyDetails.place }}
        </p>
        <p class="ticket__note">
          {{ partyDetails.evening }}
        </p>
        <p class="ticket__note">
          {{ partyDetails.idCheck }}
        </p>
      </template>

      <template v-else>
        <p class="ticket__meta">
          Saturday · private villa
        </p>
        <p class="ticket__hold">
          Held until you are accepted
        </p>
      </template>
    </div>
    <div class="ticket__stub" aria-hidden="true">
      <span>{{ code }}</span>
      <span>{{ accepted ? 'Admit one' : 'Pending' }}</span>
    </div>
  </button>

  <Teleport to="body">
    <div
      v-if="shown"
      class="ticket-stage"
      role="dialog"
      aria-modal="true"
      :aria-label="ticketLabel"
      @click.self="closeTicket"
    >
      <div
        ref="dimEl"
        class="ticket-stage__dim"
        aria-hidden="true"
      />
      <button
        ref="closeEl"
        type="button"
        class="ticket-stage__close"
        @click="closeTicket"
      >
        Close
      </button>

      <article
        ref="stageEl"
        class="ticket ticket--stage"
        :style="stageStyle"
      >
        <div class="ticket__main">
          <p class="ticket__brand">
            La Vida Loca
          </p>
          <p class="ticket__kicker">
            {{ accepted ? 'Accepted' : 'Pending' }}
          </p>
          <p class="ticket__name">
            {{ guestName }}
          </p>
          <p class="ticket__meta">
            {{ code }}
          </p>

          <template v-if="accepted">
            <p class="ticket__meta">
              {{ partyDetails.day }} · {{ partyDetails.arrival }}
            </p>
            <p class="ticket__meta">
              {{ partyDetails.place }}
            </p>
            <p class="ticket__note">
              {{ partyDetails.evening }}
            </p>
            <p class="ticket__note">
              {{ partyDetails.idCheck }}
            </p>
          </template>

          <template v-else>
            <p class="ticket__meta">
              Saturday · private villa
            </p>
            <p class="ticket__hold">
              Held until you are accepted
            </p>
          </template>
        </div>
        <div class="ticket__stub" aria-hidden="true">
          <span>{{ code }}</span>
          <span>{{ accepted ? 'Admit one' : 'Pending' }}</span>
        </div>
      </article>
    </div>
  </Teleport>
</template>

<style scoped>
.ticket {
  display: grid;
  grid-template-columns: 1fr 4.6rem;
  width: 100%;
  overflow: hidden;
  color: #3a2414;
  text-align: left;
  cursor: pointer;
  background:
    radial-gradient(ellipse at 0% 0%, rgb(120 70 24 / 0.16), transparent 42%),
    linear-gradient(#f7f1e2, #efe2c6);
  border: 0;
  filter: drop-shadow(0 14px 22px rgb(18 6 0 / 0.28));
  transition:
    transform 180ms ease,
    filter 180ms ease;
}

button.ticket:hover {
  filter: drop-shadow(0 18px 28px rgb(18 6 0 / 0.36));
}

button.ticket.ticket--held {
  visibility: hidden;
}

button.ticket:focus-visible {
  outline: 2px solid #f5f0e6;
  outline-offset: 3px;
}

.ticket__main {
  padding: 0.95rem 1rem 1.05rem 1.15rem;
}

.ticket__brand {
  margin: 0;
  font-family: Italianno, cursive;
  font-size: 2.35rem;
  line-height: 0.85;
  color: #6a3014;
}

.ticket__kicker,
.ticket__meta,
.ticket__hold,
.ticket__note,
.ticket__stub {
  font-family: "Courier Prime", ui-monospace, monospace;
}

.ticket__kicker {
  margin: 0.4rem 0 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.ticket__name {
  margin: 0.35rem 0 0;
  font-family: Caveat, cursive;
  font-size: 1.85rem;
  font-weight: 600;
  line-height: 1;
}

.ticket__meta,
.ticket__hold,
.ticket__note {
  margin: 0.4rem 0 0;
  font-size: 0.72rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
}

.ticket__hold,
.ticket__note {
  color: rgb(90 48 20 / 0.78);
}

.ticket__stub {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 0.75rem 0.2rem;
  border-left: 1.5px dashed rgb(90 48 20 / 0.45);
  background: rgb(120 70 24 / 0.06);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.ticket__stub span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.ticket-stage {
  position: fixed;
  inset: 0;
  z-index: 240;
  display: grid;
  place-items: center;
  padding: 4.5rem 1.25rem 1.5rem;
}

.ticket-stage__dim {
  position: absolute;
  inset: 0;
  background: rgb(4 16 42 / 0.78);
  opacity: 0;
  pointer-events: none;
}

.ticket-stage__close {
  position: absolute;
  top: 1.15rem;
  right: 1.15rem;
  z-index: 1;
  border: 0;
  background: transparent;
  color: #f5f0e6;
  font-family: "DM Sans", sans-serif;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0;
}

.ticket-stage__close:focus-visible {
  outline: 2px solid #f5f0e6;
  outline-offset: 4px;
}

.ticket--stage {
  --lift: 1;
  position: relative;
  z-index: 1;
  grid-template-columns: 1fr calc(4.6rem * var(--lift));
  cursor: default;
  transform-origin: center center;
  transition: none;
  filter: drop-shadow(0 calc(14px * var(--lift)) calc(22px * var(--lift)) rgb(18 6 0 / 0.28));
  will-change: transform;
}

.ticket--stage .ticket__main {
  padding:
    calc(0.95rem * var(--lift))
    calc(1rem * var(--lift))
    calc(1.05rem * var(--lift))
    calc(1.15rem * var(--lift));
}

.ticket--stage .ticket__brand {
  font-size: calc(2.35rem * var(--lift));
}

.ticket--stage .ticket__kicker {
  margin-top: calc(0.4rem * var(--lift));
  font-size: calc(0.68rem * var(--lift));
}

.ticket--stage .ticket__name {
  margin-top: calc(0.35rem * var(--lift));
  font-size: calc(1.85rem * var(--lift));
}

.ticket--stage .ticket__meta,
.ticket--stage .ticket__hold,
.ticket--stage .ticket__note {
  margin-top: calc(0.4rem * var(--lift));
  font-size: calc(0.72rem * var(--lift));
}

.ticket--stage .ticket__stub {
  gap: calc(0.85rem * var(--lift));
  padding: calc(0.75rem * var(--lift)) calc(0.2rem * var(--lift));
  border-left-width: calc(1.5px * var(--lift));
  font-size: calc(0.68rem * var(--lift));
}

@media (prefers-reduced-motion: reduce) {
  .ticket,
  .ticket-stage,
  .ticket-stage__close {
    transition: none;
  }
}
</style>
