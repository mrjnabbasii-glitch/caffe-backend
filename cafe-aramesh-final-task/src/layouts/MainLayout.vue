<template>
  <q-layout view="hHh lpR fff" class="cafe-bg">
    <q-header class="cafe-header">
      <q-toolbar class="cafe-toolbar">
        <router-link to="/" class="cafe-brand">
          <CafeMark />
          <span>کافه آرامش</span>
        </router-link>

        <div class="cafe-clock" aria-label="تاریخ و ساعت تهران">
          <span>{{ tehranDate }}</span><span class="cafe-clock-divider" aria-hidden="true"></span><span>{{ tehranTime }}</span>
        </div>

        <nav class="cafe-nav gt-sm" aria-label="منوی اصلی">
          <router-link to="/" exact-active-class="cafe-nav-active">خانه</router-link>
          <router-link to="/menu" exact-active-class="cafe-nav-active">منو</router-link>
          <router-link
            to="/tables"
            :class="{ 'cafe-nav-active': $route.path === '/reservation' }"
            exact-active-class="cafe-nav-active"
            >رزرو میز</router-link
          >
        </nav>

        <CartLink />

        <q-btn flat round icon="person_outline" aria-label="منوی حساب کاربری" class="cafe-account-button gt-sm">
          <q-menu class="cafe-account-menu" anchor="bottom end" self="top end" :offset="[0, 8]">
            <q-list padding>
              <q-item v-if="!auth.isAuthenticated" clickable :to="loginDestination">
                <q-item-section>ورود / ثبت‌نام</q-item-section>
              </q-item>
              <template v-else>
                <q-item clickable to="/my-reservations">
                  <q-item-section>رزروهای من</q-item-section>
                </q-item>
                <q-item clickable to="/my-orders">
                  <q-item-section>سفارش‌های من</q-item-section>
                </q-item>
                <q-item clickable :disable="loggingOut" @click="logout">
                  <q-item-section>خروج از حساب</q-item-section>
                </q-item>
              </template>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn
          flat
          round
          icon="menu"
          aria-label="باز کردن منو"
          :aria-expanded="drawer"
          class="lt-md"
          @click="drawer = !drawer"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" side="left" bordered class="cafe-drawer lt-md">
      <q-list padding>
        <q-item clickable v-ripple to="/" @click="drawer = false">
          <q-item-section>خانه</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/menu" @click="drawer = false">
          <q-item-section>منو</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/tables" @click="drawer = false">
          <q-item-section>رزرو میز</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/my-reservations" @click="drawer = false">
          <q-item-section>رزروهای من</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/my-orders" @click="drawer = false">
          <q-item-section>سفارش‌های من</q-item-section>
        </q-item>
        <q-item v-if="!auth.isAuthenticated" clickable :to="loginDestination" @click="drawer = false"
          ><q-item-section>ورود / ثبت‌نام</q-item-section></q-item
        >
        <q-item v-else clickable :disable="loggingOut" @click="logout"
          ><q-item-section>خروج از حساب {{ auth.user.name }}</q-item-section></q-item
        >
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-linear-progress v-if="bookingStore.loading" indeterminate color="primary" />
      <q-banner v-if="bookingStore.error" class="bg-red-1 text-red-9" role="alert">
        {{ bookingStore.error }}
        <template #action>
          <q-btn
            flat
            label="تلاش دوباره"
            :loading="bookingStore.loading"
            @click="bookingStore.initialize"
          />
        </template>
      </q-banner>
      <slot />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import { useBookingStore } from '../stores/bookingStore'
import CafeMark from '../components/CafeMark.vue'
import CartLink from '../components/CartLink.vue'

const auth = useAuthStore()
const bookingStore = useBookingStore()
const router = useRouter()
const loginDestination = computed(() => ({
  name: 'login',
  query: { redirect: router.currentRoute.value.fullPath }
}))
const $q = useQuasar()
const drawer = ref(false)
const loggingOut = ref(false)
const now = ref(new Date())
const tehranDate = computed(() => new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'Asia/Tehran', day: 'numeric', month: 'long', year: 'numeric'
}).format(now.value))
const tehranTime = computed(() => new Intl.DateTimeFormat('fa-IR', {
  timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hour12: false
}).format(now.value))
let clockInterval
onMounted(() => { clockInterval = setInterval(() => { now.value = new Date() }, 30000) })
onUnmounted(() => clearInterval(clockInterval))

// Every page uses this layout, so menu, tables and reservations refresh on each navigation.
onMounted(() => bookingStore.initialize())

async function logout() {
  loggingOut.value = true
  try {
    if (bookingStore.temporaryLock) await bookingStore.releaseSelectedTable()
    await auth.logout()
    bookingStore.clearPrivateData()
    drawer.value = false
    await router.push('/login')
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.cafe-account-button {
  background: #183322;
  border: 1px solid #c99461;
}

:global(.cafe-account-menu) {
  min-width: 180px;
  background: #132d1c;
  color: #fff1d6;
  border: 1px solid #c99461;
  border-radius: 12px;
  direction: rtl;
}

:global(.cafe-account-menu .q-item) {
  color: inherit;
  font-weight: 600;
}

:global(.cafe-account-menu .q-item:focus-visible) {
  outline: 2px solid #fff1d6;
  outline-offset: -3px;
}

@media (max-width: 600px) {
  .cafe-toolbar { flex-wrap: wrap; gap: 5px 9px; padding-block: 7px; }
  .cafe-brand { margin-inline-end: auto; }
  .cafe-clock { order: 1; margin-inline: auto; flex-basis: max-content; }
}
@media (max-width: 480px) {
  .cafe-clock { margin-inline: 0; }
  .cafe-clock::before { content: 'تهران'; }
}
</style>
