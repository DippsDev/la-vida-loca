<script setup lang="ts">
/**
 * Readable cursive "La Vida Loca" — Italianno with a left→right write reveal,
 * plus an SVG underline stroke using pathLength dash animation.
 */
</script>

<template>
  <div
    class="handwriting-stage flex w-full max-w-3xl flex-col items-center px-2"
    role="img"
    aria-label="La Vida Loca"
  >
    <div class="write-line">
      <p class="phrase">
        La Vida Loca
      </p>
    </div>

    <svg
      class="flourish-svg mt-1 h-auto w-[min(92%,36rem)] overflow-visible"
      viewBox="0 0 900 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        class="flourish"
        pathLength="1"
        d="M 20 12 C 160 22 340 24 520 14 C 680 6 800 8 880 12"
      />
    </svg>
  </div>
</template>

<style scoped>
.handwriting-stage {
  animation: stage-fade 9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.write-line {
  width: max-content;
  max-width: 100%;
  clip-path: inset(0 100% 0 0);
  animation: write-reveal 9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.phrase {
  margin: 0;
  padding: 0 0.06em;
  color: #fff8ee;
  font-family: Italianno, cursive;
  font-size: clamp(3.75rem, 14vw, 6.75rem);
  line-height: 1;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 14px rgb(0 0 0 / 45%);
  white-space: nowrap;
}

.flourish {
  fill: none;
  stroke: rgb(255 248 238 / 75%);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: write-flourish 9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

/* ~3.5s write → ~2s hold → reverse → loop */
@keyframes write-reveal {
  0% {
    clip-path: inset(0 100% 0 0);
  }
  42% {
    clip-path: inset(0 0 0 0);
  }
  68% {
    clip-path: inset(0 0 0 0);
  }
  100% {
    clip-path: inset(0 100% 0 0);
  }
}

@keyframes write-flourish {
  0%,
  30% {
    stroke-dashoffset: 1;
    opacity: 1;
  }
  48% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  68% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  100% {
    stroke-dashoffset: 1;
    opacity: 0;
  }
}

@keyframes stage-fade {
  0%,
  68% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .handwriting-stage,
  .write-line,
  .flourish {
    animation: none !important;
  }

  .write-line {
    clip-path: inset(0 0 0 0);
  }

  .flourish {
    stroke-dashoffset: 0;
    opacity: 1;
  }

  .handwriting-stage {
    opacity: 1;
  }
}
</style>
