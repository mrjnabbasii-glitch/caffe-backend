<template>
  <MainLayout>
    <q-page class="booking-page">
      <section v-if="!bookingOpen" class="booking-list" aria-labelledby="table-list-title">
        <h1 id="table-list-title" ref="listHeading" tabindex="-1">رزرو میز</h1>
        <p class="booking-subtitle">تعداد نفرات را انتخاب کنید تا میزهای مناسب را ببینید.</p>

        <div class="booking-options capacity-options" role="group" aria-label="تعداد نفرات">
          <button
            v-for="option in capacityOptions"
            :key="option.value"
            type="button"
            :aria-pressed="capacityFilter === option.value"
            @click="capacityFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <div
          v-if="!bookingStore.loading && !bookingStore.error && !filteredTables.length"
          class="booking-empty"
        >
          میزی با این ظرفیت پیدا نشد.
        </div>
        <div v-else class="booking-table-grid">
          <TableCard
            v-for="table in filteredTables"
            :key="table.id"
            :table="table"
            :busy="bookingStore.busy"
            :preferred="String(table.id) === route.query.table"
            @select="openBooking"
          />
        </div>
      </section>

      <form v-else class="booking-summary" @submit.prevent="confirmBooking">
        <h1 ref="summaryHeading" tabindex="-1">رزرو میز</h1>
        <div class="booking-countdown" role="timer" aria-live="off">
          <q-icon name="timer" size="24px" />
          <span>زمان تکمیل رزرو</span>
          <strong dir="ltr">{{ formatDigits(formattedTime) }}</strong>
        </div>

        <div class="booking-details-grid">
          <aside class="booking-selected-table">
            <img
              v-if="tablePhoto"
              class="booking-photo"
              :src="tablePhoto"
              alt="عکس میز انتخاب‌شده"
              width="760"
              height="440"
            />
            <div class="booking-table-title">
              <h2>{{ bookingStore.selectedTable?.title }}</h2>
              <span class="booking-capacity">
                <q-icon name="groups" size="20px" />
                <span>{{ formatDigits(bookingStore.selectedTable?.capacity ?? '') }} نفر</span>
              </span>
            </div>
          </aside>
          <div class="booking-form-fields">
        <fieldset class="booking-section">
          <legend>ساعت حضور</legend>
          <div class="booking-options">
            <label v-for="time in timeOptions" :key="time" class="booking-time-option">
              <input
                v-model="bookingStore.bookingTime"
                type="radio"
                name="booking-time"
                :value="time"
              />
              <span dir="ltr">{{ formatDigits(time) }}</span>
            </label>
          </div>
        </fieldset>

        <div class="booking-section booking-extras">
          <q-input
            v-model="bookingStore.customer.name"
            outlined
            dense
            label="نام رزروکننده"
            maxlength="60"
            autocomplete="name"
          />
          <details v-if="bookingStore.addonsList.length" class="booking-addons">
            <summary>افزودن پکیج پذیرایی</summary>
            <CafeAddons v-model="bookingStore.addons" :items="bookingStore.addonsList" />
          </details>
        </div>

        <div class="booking-section">
          <div class="booking-total">
            <span>مبلغ نهایی</span>
            <strong>{{ bookingStore.totalPrice.toLocaleString('fa-IR') }} تومان</strong>
          </div>
          <q-btn
            type="submit"
            label="تأیید رزرو"
            class="cafe-btn booking-confirm text-white"
            unelevated
            :loading="bookingStore.busy"
            :disable="!canSubmit || !bookingStore.temporaryLock"
          />
          <q-btn
            flat
            label="انصراف و آزاد کردن میز"
            class="booking-cancel"
            :disable="bookingStore.busy"
            @click="cancelBooking"
          />
        </div>
          </div>
        </div>
      </form>
    </q-page>
  </MainLayout>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useQuasar } from 'quasar'
import MainLayout from '../layouts/MainLayout.vue'
import { tablePhotos } from '../assets/cafePhotos'
import TableCard from '../components/TableCard.vue'
import CafeAddons from '../components/CafeAddons.vue'
import { useBookingStore } from '../stores/bookingStore'
import { useBookingTimer } from '../composables/useBookingTimer'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const $q = useQuasar()
const bookingStore = useBookingStore()

const capacityFilter = ref('all')
const bookingOpen = ref(false)
const listHeading = ref(null)
const summaryHeading = ref(null)

watch(bookingOpen, async (opened) => {
  await nextTick()
  const heading = opened ? summaryHeading.value : listHeading.value
  heading?.focus()
})

function formatDigits(value) {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit])
}

const capacityOptions = [
  { label: 'همه', value: 'all' },
  { label: '۲ نفره', value: 2 },
  { label: '۴ نفره', value: 4 },
  { label: '۶ نفره', value: 6 }
]

const timeOptions = computed(() => bookingStore.timeOptions)
const tablePhoto = computed(() => tablePhotos[bookingStore.selectedTable?.id])
let refreshInterval
onMounted(() => {
  refreshInterval = setInterval(() => {
    bookingStore.refreshTables().catch((error) => {
      bookingStore.error = error.message
    })
  }, 15000)
})

const filteredTables = computed(() =>
  capacityFilter.value === 'all'
    ? bookingStore.tables
    : bookingStore.tables.filter((table) => table.capacity === capacityFilter.value)
)

const canSubmit = computed(() =>
  Boolean(
    bookingStore.selectedTable &&
    bookingStore.customer.name.trim().length >= 3 &&
    bookingStore.bookingTime
  )
)

const {
  formattedTime,
  start: startTimer,
  stop: stopTimer
} = useBookingTimer(() => {
  const expiredTable = bookingStore.selectedTable?.title || 'میز انتخابی'

  bookingOpen.value = false
  bookingStore
    .releaseSelectedTable()
    .catch((error) => $q.notify({ type: 'negative', message: error.message }))

  $q.notify({
    type: 'warning',
    message: `زمان رزرو موقت «${expiredTable}» تمام شد و میز آزاد شد.`,
    position: 'top',
    timeout: 4000
  })
})

async function openBooking(table) {
  if (!auth.isAuthenticated) {
    const redirect = router.resolve({ path: '/reservation', query: { table: table.id } }).fullPath
    return router.push({ name: 'login', query: { redirect } })
  }
  try {
    if (await bookingStore.selectTable(table)) {
      bookingOpen.value = true
      startTimer(bookingStore.expiresAt)
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
    bookingStore.refreshTables().catch(() => {})
  }
}

function cancelBooking() {
  stopTimer()
  bookingOpen.value = false
  bookingStore
    .releaseSelectedTable()
    .catch((error) => $q.notify({ type: 'negative', message: error.message }))
}

async function confirmBooking() {
  if (!canSubmit.value || !bookingStore.temporaryLock) return

  try {
    const reservation = await bookingStore.saveReservation()
    if (!reservation) return
    stopTimer()
    bookingOpen.value = false

    $q.notify({
      type: 'positive',
      message: `میز ${reservation.tableTitle} با موفقیت برای شما رزرو شد.`,
      position: 'top',
      timeout: 3500
    })

    router.push(`/receipt/${reservation.bookingId}`)
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
  }
}

onUnmounted(() => {
  clearInterval(refreshInterval)
  stopTimer()
  if (bookingStore.temporaryLock) {
    bookingStore.releaseSelectedTable().catch(() => {})
  }
})
</script>
