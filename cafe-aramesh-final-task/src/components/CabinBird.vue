<template>
  <div
    v-for="bird in birds"
    :key="bird"
    class="cabin-bird"
    :class="['bird-' + bird, { 'is-ready': ready }]"
    aria-hidden="true"
  >
    <img
      v-for="(frame, index) in frames"
      :key="frame"
      :src="frame"
      alt=""
      class="bird-frame"
      :class="{ 'bird-perched': index === 3 }"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import wingsUp from '../assets/photos/cabin-bird-up.webp'
import wingsOut from '../assets/photos/cabin-bird-out.webp'
import wingsDown from '../assets/photos/cabin-bird-down.webp'
import perched from '../assets/photos/cabin-bird-perched.webp'

const birds = [1, 2, 3]
const frames = [wingsUp, wingsOut, wingsDown, perched]
const ready = ref(false)

onMounted(async () => {
  try {
    await Promise.all(frames.map((src) => {
      const image = new Image()
      image.src = src
      return image.decode()
    }))
    ready.value = true
  } catch {
    // The login form is available even if a decorative image fails to load.
  }
})
</script>

<style scoped>
.cabin-bird {
  position: absolute;
  z-index: 2;
  inset-block-start: 0;
  left: var(--landing-x);
  width: var(--bird-width);
  aspect-ratio: 1;
  pointer-events: none;
  visibility: hidden;
  transform-origin: center 76%;
  transform: translate(-50%, -76%);
}
.bird-1 {
  --landing-x: 15%;
  --bird-width: clamp(82px, 26vw, 165px);
  --delay: 0s;
  --start-x: -140%;
  --mid-x: -100%;
  --turn: -12deg;
}
.bird-2 {
  --landing-x: 50%;
  --bird-width: clamp(72px, 22.5vw, 140px);
  --delay: .52s;
  --start-x: -55%;
  --mid-x: -35%;
  --turn: 6deg;
}
.bird-3 {
  --landing-x: 85%;
  --bird-width: clamp(78px, 24vw, 153px);
  --delay: 1.06s;
  --start-x: 42%;
  --mid-x: 6%;
  --turn: 13deg;
}
.is-ready {
  visibility: visible;
  animation: approach 2.55s linear var(--delay) both;
}
.bird-frame {
  position: absolute;
  width: 100%;
  height: 100%;
  inset: 0;
  opacity: 0;
}
.is-ready .bird-frame:nth-child(1) { animation: wings-up .38s step-end var(--delay) 6; }
.is-ready .bird-frame:nth-child(2) { animation: wings-out .38s step-end var(--delay) 6; }
.is-ready .bird-frame:nth-child(3) { animation: wings-down .38s step-end var(--delay) 6; }
.is-ready .bird-perched { animation: perch 2.55s step-end var(--delay) both; }

@keyframes approach {
  0% { opacity: 0; transform: translate(var(--start-x), -105%) scale(.12) rotate(var(--turn)); }
  12% { opacity: 1; }
  45% { transform: translate(var(--mid-x), -105%) scale(.45) rotate(var(--turn)); }
  72% { transform: translate(-40%, -110%) scale(1.15) rotate(-9deg); }
  89% { transform: translate(-50%, -76%) scale(1) rotate(0); }
  95% { transform: translate(-50%, -80%) scale(1); }
  100% { transform: translate(-50%, -76%) scale(1); }
}
@keyframes wings-up {
  0% { opacity: 1; }
  29%, 100% { opacity: 0; }
}
@keyframes wings-out {
  0% { opacity: 0; }
  29% { opacity: 1; }
  60%, 100% { opacity: 0; }
}
@keyframes wings-down {
  0% { opacity: 0; }
  60% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes perch {
  0% { opacity: 0; }
  89.4%, 100% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .is-ready, .is-ready .bird-frame { animation: none !important; }
  .is-ready .bird-perched { opacity: 1; }
}
</style>
