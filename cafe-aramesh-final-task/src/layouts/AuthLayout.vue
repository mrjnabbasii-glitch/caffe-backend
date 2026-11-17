<template>
  <main class="auth-page" dir="rtl">
    <header>
      <router-link to="/" class="auth-brand"><CafeMark /> کافه آرامش</router-link>
      <router-link to="/" class="back-link"
        >بازگشت به خانه <span aria-hidden="true">←</span></router-link
      >
    </header>
    <section class="auth-stage">
      <div class="auth-panel">
        <CabinBird v-if="showBird" />
        <slot />
      </div>
    </section>
  </main>
</template>

<script setup>
import CafeMark from '../components/CafeMark.vue'
import CabinBird from '../components/CabinBird.vue'

defineProps({ showBird: Boolean })
</script>

<style scoped>
.auth-page {
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  display: grid;
  grid-template-rows: auto 1fr;
  padding: clamp(16px, 3vw, 32px);
  color: #f7f0e3;
  background-color: #192a20;
  background-image:
    linear-gradient(180deg, #07120cb0, transparent 22%, transparent 82%, #07120c55),
    url('../assets/photos/forest-porch.webp');
  background-size: cover;
  background-position: center;
}
.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgba(11, 23, 15, .47), transparent 28%, transparent 70%, rgba(11, 25, 18, .48));
  pointer-events: none;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: min(100%, 1120px);
  margin-inline: auto;
  z-index: 1;
}
.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #fff8e9;
  text-shadow: 0 2px 12px #0d1e14;
  font-size: 20px;
  font-weight: 900;
  text-decoration: none;
}
.auth-brand :deep(svg) { width: 34px; }
.back-link {
  color: #fff8e9;
  text-shadow: 0 2px 8px #0d1e14;
  text-decoration: none;
  font-size: 13px;
}
.back-link:hover { text-decoration: underline; }
.auth-stage {
  display: grid;
  place-items: center;
  padding: 18px 0 42px;
}
.auth-panel {
  position: relative;
  width: min(100%, 370px);
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid #f0dfbc80;
  border-radius: 10px;
  background: rgba(27, 33, 23, .79);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 22px 75px rgba(12, 23, 16, .36);
  color: #fff6e7;
  --cafe-primary: #305426;
  --cafe-primary-dark: #fff4dc;
  --cafe-surface: #383a2c;
  --cafe-text: #fff6e7;
  --cafe-muted: #f2e7d2;
  --cafe-border: #e1d1ad9e;
}
@media (max-width: 640px) {
  .auth-stage { padding-block: 46px 22px; }
  .auth-panel { background: rgba(27, 33, 23, .87); }
}
</style>
