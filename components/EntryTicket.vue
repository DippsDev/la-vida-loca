<script setup lang="ts">
import { partyDetails } from '~/utils/partyDetails'

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
</script>

<template>
  <article
    class="ticket"
    :aria-label="ticketLabel"
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
</template>

<style scoped>
.ticket {
  display: grid;
  grid-template-columns: 1fr 4.6rem;
  overflow: hidden;
  color: #3a2414;
  background:
    radial-gradient(ellipse at 0% 0%, rgb(120 70 24 / 0.16), transparent 42%),
    linear-gradient(#f7f1e2, #efe2c6);
  filter: drop-shadow(0 14px 22px rgb(18 6 0 / 0.28));
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
</style>
