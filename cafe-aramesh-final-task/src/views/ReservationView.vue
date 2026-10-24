<template>
  <MainLayout>
    <q-page class="page-width q-py-xl">
      <div class="text-h4 text-center text-weight-bold cafe-brown q-mb-md">
        رزرو میز
      </div>

      <q-card class="cafe-card" flat bordered>
        <q-card-section class="text-center">
          <div class="text-h6">رزرو سریع کافه</div>
          <p class="q-mb-none">
            ابتدا تعداد نفرات را انتخاب کنید تا میزهای مناسب نمایش داده شوند.
          </p>
        </q-card-section>

        <q-card-section>
          <q-select
            v-model="capacityFilter"
            :options="capacityOptions"
            label="تعداد نفرات"
            outlined
            emit-value
            map-options
            class="q-mb-xl"
          />

          <div v-if="!filteredTables.length" class="text-center text-grey-7 q-py-xl">
            میزی با این ظرفیت در دسترس نیست.
          </div>

          <div v-else class="row q-col-gutter-lg">
            <div
              v-for="table in filteredTables"
              :key="table.id"
              class="col-12 col-sm-6 col-md-4"
            >
              <TableCard :table="table" @select="openBooking" />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-dialog v-model="dialogOpen" persistent>
        <q-card style="width: 560px; max-width: 95vw">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-h6">{{ bookingStore.selectedTable?.title }}</div>
              <div class="text-body2 q-mt-xs">
                ظرفیت: {{ bookingStore.selectedTable?.capacity }} نفر
              </div>
            </div>

            <q-chip v-if="bookingStore.temporaryLock" color="orange" text-color="white" icon="schedule">
              رزرو موقت: {{ formattedTime }}
            </q-chip>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <q-banner v-if="bookingStore.temporaryLock" class="bg-orange-1 text-orange-10 q-mb-md" rounded>
              این میز برای شما موقتاً نگه داشته شده است. تا پایان زمان باقی‌مانده رزرو را نهایی کنید.
            </q-banner>

            <q-input
              v-model="bookingStore.customer.name"
              outlined
              label="نام مشتری"
              class="q-mb-md"
              maxlength="60"
              counter
            />

            <q-select
              v-model="bookingStore.bookingTime"
              :options="timeOptions"
              outlined
              label="ساعت حضور"
              class="q-mb-lg"
            />

            <CafeAddons
              v-model="bookingStore.addons"
              :items="bookingStore.addonsList"
            />

            <q-separator class="q-my-lg" />

            <div class="row justify-between text-subtitle1 text-weight-bold">
              <span>مبلغ نهایی</span>
              <span>{{ bookingStore.totalPrice.toLocaleString('fa-IR') }} تومان</span>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="انصراف" :disable="bookingStore.busy" @click="cancelBooking" />
            <q-btn
              label="تأیید و دریافت بلیت"
              class="cafe-btn text-white"
              unelevated
              :loading="bookingStore.busy"
              :disable="!canSubmit || !bookingStore.temporaryLock"
              @click="confirmBooking"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import MainLayout from '../layouts/MainLayout.vue'
import TableCard from '../components/TableCard.vue'
import CafeAddons from '../components/CafeAddons.vue'
import { useBookingStore } from '../stores/bookingStore'
import { useBookingTimer } from '../composables/useBookingTimer'

const router = useRouter()
const $q = useQuasar()
const bookingStore = useBookingStore()

const capacityFilter = ref('all')
const dialogOpen = ref(false)

const capacityOptions = [
  { label: 'همه', value: 'all' },
  { label: '۲ نفره', value: 2 },
  { label: '۴ نفره', value: 4 },
  { label: '۶ نفره', value: 6 }
]

const timeOptions = computed(() => bookingStore.timeOptions)
let refreshInterval
onMounted(() => {
  refreshInterval = setInterval(() => {
    bookingStore.refreshTables().catch(error => { bookingStore.error = error.message })
  }, 15000)
})

const filteredTables = computed(() =>
  capacityFilter.value === 'all'
    ? bookingStore.tables
    : bookingStore.tables.filter(table => table.capacity === Number(capacityFilter.value))
)

const canSubmit = computed(() =>
  Boolean(
    bookingStore.selectedTable &&
    bookingStore.customer.name.trim().length >= 3 &&
    bookingStore.bookingTime
  )
)

const { formattedTime, start: startTimer, stop: stopTimer } = useBookingTimer(() => {
  const expiredTable = bookingStore.selectedTable?.title || 'میز انتخابی'

  dialogOpen.value = false
  bookingStore.releaseSelectedTable().catch(error => $q.notify({ type: 'negative', message: error.message }))

  $q.notify({
    type: 'warning',
    message: `زمان رزرو موقت «${expiredTable}» تمام شد و میز آزاد شد.`,
    position: 'top',
    timeout: 4000
  })
})

async function openBooking(table) {
  try {
    if (await bookingStore.selectTable(table)) {
      dialogOpen.value = true
      startTimer(bookingStore.expiresAt)
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: error.message })
    bookingStore.refreshTables().catch(() => {})
  }
}

function cancelBooking() {
  stopTimer()
  dialogOpen.value = false
  bookingStore.releaseSelectedTable().catch(error => $q.notify({ type: 'negative', message: error.message }))
}

async function confirmBooking() {
  if (!canSubmit.value || !bookingStore.temporaryLock) return

  try {
    const reservation = await bookingStore.saveReservation()
    if (!reservation) return
    stopTimer()
    dialogOpen.value = false

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
