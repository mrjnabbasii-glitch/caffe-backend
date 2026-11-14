<template>
  <MainLayout>
    <q-page class="page-width q-py-xl">
      <div class="text-h4 text-center text-weight-bold cafe-heading q-mb-lg">
        🎫 بلیت دیجیتال رزرو
      </div>
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>
      <q-banner v-else-if="error" class="bg-red-1 text-red-9" role="alert">
        {{ error }}
        <template #action><q-btn flat label="تلاش دوباره" @click="loadReceipt" /></template>
      </q-banner>
      <q-card v-else-if="reservation" class="receipt-ticket q-pa-md" flat>
        <img v-if="tablePhotos[reservation.tableId]" class="receipt-table-photo" :src="tablePhotos[reservation.tableId]" alt="" loading="lazy" />
        <q-card-section class="text-center">
          <div class="text-h5 text-weight-bold">کافه آرامش ☕</div>
          <q-chip color="grey-3" text-color="primary">{{ reservation.bookingId }}</q-chip>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">میز: {{ reservation.tableTitle }}</div>
            <div class="col-12 col-sm-6">ظرفیت: {{ reservation.capacity }} نفر</div>
            <div class="col-12 col-sm-6">نام مشتری: {{ reservation.customerName }}</div>
            <div class="col-12 col-sm-6">ساعت حضور: {{ reservation.bookingTime }}</div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-md">پکیج پذیرایی</div>
          <div
            v-for="item in reservation.addons"
            :key="item.id"
            class="row justify-between q-py-xs"
          >
            <span>{{ item.title }} × {{ item.quantity }}</span>
            <span>{{ (item.price * item.quantity).toLocaleString('fa-IR') }} تومان</span>
          </div>
          <div v-if="!reservation.addons.length" class="text-grey-7">بدون پکیج پذیرایی</div>
          <div class="row justify-between q-mt-md">
            <span>هزینه میز</span
            ><span>{{ reservation.tablePrice.toLocaleString('fa-IR') }} تومان</span>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="row justify-between text-h6">
          <span>مبلغ نهایی</span
          ><strong>{{ reservation.totalPrice.toLocaleString('fa-IR') }} تومان</strong>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            label="بازگشت به رزرو میز"
            class="cafe-btn text-white"
            unelevated
            to="/reservation"
          />
        </q-card-actions>
      </q-card>
    </q-page>
  </MainLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { tablePhotos } from '../assets/cafePhotos'
import { useBookingStore } from '../stores/bookingStore'
const route = useRoute()
const bookingStore = useBookingStore()
const reservation = ref(null)
const loading = ref(false)
const error = ref('')
let requestVersion = 0
async function loadReceipt() {
  const version = ++requestVersion
  loading.value = true
  error.value = ''
  reservation.value = null
  try {
    const result = await bookingStore.getReservation(route.params.bookingId)
    if (version === requestVersion) reservation.value = result
  } catch (cause) {
    if (version === requestVersion) error.value = cause.message
  } finally {
    if (version === requestVersion) loading.value = false
  }
}
watch(() => route.params.bookingId, loadReceipt, { immediate: true })
</script>
