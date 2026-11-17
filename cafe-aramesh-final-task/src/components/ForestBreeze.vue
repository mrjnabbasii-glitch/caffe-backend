<template>
  <div class="forest-breeze" :class="{ paused }" aria-hidden="true">
    <i v-for="(leaf, index) in leaves" :key="index" :style="leaf"></i>
  </div>
  <button class="breeze-toggle" type="button" dir="rtl" @click="paused = !paused">
    {{ paused ? 'ادامهٔ حرکت برگ‌ها' : 'توقف حرکت برگ‌ها' }}
  </button>
</template>

<script setup>
import { ref } from 'vue'

const paused = ref(false)
const leaves = Array.from({ length: 22 }, (_, index) => ({
  '--x': `${(index * 31 + 9) % 100}%`,
  '--y': `${(index * 19 + 6) % 89}%`,
  '--size': `${5 + (index * 7) % 11}px`,
  '--delay': `-${(index * 23) % 170 / 10}s`,
  '--duration': `${9 + (index * 5) % 9}s`,
  '--drift': `${120 + (index * 37) % 240}px`,
  '--rise': `${48 + (index * 31) % 135}px`
}))
</script>

<style scoped>
.forest-breeze {
  position: fixed;
  z-index: 20;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.forest-breeze::before {
  content: '';
  position: absolute;
  inset: -15%;
  background: radial-gradient(ellipse at 72% 48%, #cad98e17, transparent 53%);
  animation: forest-light 16s ease-in-out infinite alternate;
}
.forest-breeze i {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--size);
  height: calc(var(--size) * .55);
  border-radius: 90% 18% 85% 25%;
  background: linear-gradient(165deg, #e6edc7, #9ca872);
  opacity: 0;
  animation: drift var(--duration) linear var(--delay) infinite;
}
.forest-breeze i:nth-child(3n) {
  filter: blur(1.3px);
  background: #e6edc5;
}
.forest-breeze.paused::before,
.forest-breeze.paused i { animation-play-state: paused; }
.breeze-toggle {
  position: fixed;
  z-index: 21;
  left: max(12px, env(safe-area-inset-left));
  bottom: max(12px, env(safe-area-inset-bottom));
  min-height: 36px;
  padding: 6px 11px;
  border: 1px solid #eadfc35c;
  border-radius: 8px;
  background: #192a20e6;
  color: #fff4dc;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}
.breeze-toggle:focus-visible { outline: 2px solid #fff4dc; outline-offset: 3px; }
@keyframes drift {
  0% { transform: translate3d(0, 0, 0) rotate(-32deg) scaleX(.6); opacity: 0; }
  16%, 70% { opacity: .58; }
  30% { transform: translate3d(calc(var(--drift) * -.33), calc(var(--rise) * -.4), 0) rotate(46deg) scaleX(1); }
  62% { transform: translate3d(calc(var(--drift) * -.65), calc(var(--rise) * -.5), 0) rotate(105deg) scaleX(.45); }
  100% { transform: translate3d(calc(var(--drift) * -1), calc(var(--rise) * -1), 0) rotate(225deg) scaleX(.8); opacity: 0; }
}
@keyframes forest-light {
  from { transform: translate3d(-7%, -2%, 0); opacity: .35; }
  to { transform: translate3d(5%, 3%, 0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .forest-breeze, .breeze-toggle { display: none; }
}
</style>
