<script setup lang="ts">
/**
 * Readable cursive "La Vida Loca" — Italianno with a left→right write reveal,
 * plus an SVG underline stroke. Once the signature is written, it fades out
 * and the monogram fades in.
 */
</script>

<template>
  <div
    class="handwriting-stage flex w-full max-w-3xl flex-col items-center px-2"
    role="img"
    aria-label="La Vida Loca"
  >
    <div class="mark">
      <div class="signature">
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

      <img
        src="/logo-l.png"
        alt=""
        class="splash-logo"
        aria-hidden="true"
      >
    </div>
  </div>
</template>

<style scoped>
.mark {
  display: grid;
  place-items: center;
  min-height: clamp(7.5rem, 28vw, 11rem);
}

.signature,
.splash-logo {
  grid-area: 1 / 1;
}

.signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: signature-fade 8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.write-line {
  width: max-content;
  max-width: 100%;
  clip-path: inset(0 100% 0 0);
  animation: write-reveal 8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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
  animation: write-flourish 8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.splash-logo {
  width: clamp(9rem, 32vw, 13rem);
  height: auto;
  object-fit: contain;
  mix-blend-mode: lighten;
  opacity: 0;
  pointer-events: none;
  animation: logo-fade 8s ease forwards;
}

/* ~3.5s write → hold → signature fades out → logo fades in */
@keyframes write-reveal {
  0% {
    clip-path: inset(0 100% 0 0);
  }
  44%,
  100% {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes write-flourish {
  0%,
  28% {
    stroke-dashoffset: 1;
    opacity: 1;
  }
  52%,
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

@keyframes signature-fade {
  0%,
  62% {
    opacity: 1;
  }
  76%,
  100% {
    opacity: 0;
  }
}

@keyframes logo-fade {
  0%,
  76% {
    opacity: 0;
  }
  92%,
  100% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .signature,
  .write-line,
  .flourish,
  .splash-logo {
    animation: none !important;
  }

  .signature {
    opacity: 0;
  }

  .splash-logo {
    opacity: 1;
  }
}
</style>
