<script setup lang="ts">
useHead({ title: 'About · La Vida LOCA' })
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-cobalt-deep">
    <SiteNavbar />

    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgb(11_61_145/0.55),transparent_55%),linear-gradient(to_top,rgb(7_42_102)_0%,transparent_50%)]"
      aria-hidden="true"
    />

    <main class="relative z-10 mx-auto max-w-2xl px-5 pb-20 pt-28 sm:px-8 sm:pt-32">
      <p class="text-center text-xs font-medium uppercase tracking-[0.22em] text-cream/80">
        About the experience
      </p>

      <h1 class="mt-4 text-center font-display text-3xl font-bold tracking-wide text-cream sm:text-4xl">
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
            to="/home"
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
  </div>
</template>
