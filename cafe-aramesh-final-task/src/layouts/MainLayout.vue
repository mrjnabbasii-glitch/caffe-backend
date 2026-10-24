<template>
  <q-layout view="hHh lpR fFf" class="cafe-bg">
    <q-header elevated class="cafe-header">
      <q-toolbar class="page-width">
        <q-toolbar-title class="text-weight-bold">
          ☕ کافه آرامش
        </q-toolbar-title>

        <q-btn flat round icon="menu" class="lt-md" @click="drawer = !drawer" />

        <div class="gt-sm row q-gutter-xs">
          <q-btn flat label="خانه" to="/" />
          <q-btn flat label="منو" to="/menu" />
          <q-btn flat label="میزها" to="/tables" />
          <q-btn flat label="رزرو میز" to="/reservation" />
          <q-btn flat label="رزروهای من" to="/my-reservations" />
                  </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" side="right" bordered class="bg-brown-1 lt-md">
      <q-list padding>
        <q-item clickable v-ripple to="/" @click="drawer = false">
          <q-item-section>خانه</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/menu" @click="drawer = false">
          <q-item-section>منو</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/tables" @click="drawer = false">
          <q-item-section>میزها</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/reservation" @click="drawer = false">
          <q-item-section>رزرو میز</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/my-reservations" @click="drawer = false">
          <q-item-section>رزروهای من</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <q-linear-progress v-if="bookingStore.loading" indeterminate color="brown" />
      <q-banner v-if="bookingStore.error" class="bg-red-1 text-red-9" role="alert">
        {{ bookingStore.error }}
        <template #action>
          <q-btn flat label="تلاش دوباره" :loading="bookingStore.loading" @click="bookingStore.initialize" />
        </template>
      </q-banner>
      <slot />
    </q-page-container>

    <q-footer class="cafe-header q-pa-md text-center">
      کافه آرامش | هر فنجان، یک حال خوب ☕
    </q-footer>
  </q-layout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useBookingStore } from '../stores/bookingStore'

const drawer = ref(false)
const bookingStore = useBookingStore()
onMounted(() => bookingStore.initialize())
</script>
