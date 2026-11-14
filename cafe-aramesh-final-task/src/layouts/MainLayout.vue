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

        <q-btn flat round icon="person_outline" aria-label="منوی حساب کاربری" class="gt-sm">
          <q-menu anchor="bottom end" self="top end">
            <q-list style="min-width: 170px">
              <q-item v-if="!auth.isAuthenticated" clickable to="/login">
                <q-item-section>ورود / ثبت‌نام</q-item-section>
              </q-item>
              <template v-else>
                <q-item clickable to="/my-reservations">
                  <q-item-section>رزروهای من</q-item-section>
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
        <q-item v-if="!auth.isAuthenticated" clickable to="/login" @click="drawer = false"
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

const auth = useAuthStore()
const bookingStore = useBookingStore()
const router = useRouter()
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
