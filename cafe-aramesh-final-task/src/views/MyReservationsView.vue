<template>
  <MainLayout>
    <q-page class="page-width q-py-xl">
      <div class="text-h4 text-center text-weight-bold cafe-brown q-mb-xl">رزروهای من</div>
      <q-card v-for="reservation in bookingStore.reservations" :key="reservation.bookingId" class="cafe-card q-mb-md" flat bordered>
        <q-card-section>
          <div class="text-h6">{{ reservation.tableTitle }}</div>
          <div>{{ reservation.customerName }} — ساعت {{ reservation.bookingTime }}</div>
          <div>{{ reservation.totalPrice.toLocaleString('fa-IR') }} تومان</div>
          <div class="text-caption">{{ reservation.bookingId }}</div>
        </q-card-section>
        <q-card-actions>
          <q-btn label="مشاهده بلیت" class="cafe-btn text-white" unelevated :to="`/receipt/${reservation.bookingId}`" />
        </q-card-actions>
      </q-card>
      <div v-if="!bookingStore.loading && !bookingStore.error && !bookingStore.reservations.length" class="text-center q-pa-xl">
        هنوز رزروی برای این مرورگر ثبت نشده است.
      </div>
    </q-page>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../layouts/MainLayout.vue'
import { useBookingStore } from '../stores/bookingStore'
const bookingStore = useBookingStore()
</script>
