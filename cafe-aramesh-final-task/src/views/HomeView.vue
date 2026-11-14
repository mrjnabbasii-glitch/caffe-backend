<template>
  <MainLayout>
    <q-page class="home-page">
      <section class="home-hero" aria-labelledby="home-title">
        <div class="home-intro">
          <h1 id="home-title">کافه آرامش</h1>
          <p>جایی برای یک نوشیدنی خوش‌طعم، غذای دلچسب و چند ساعت آرامش.</p>
          <div class="home-actions">
            <q-btn
              label="رزرو میز"
              class="cafe-btn home-button text-white"
              unelevated
              to="/tables"
            />
            <q-btn label="دیدن منو" class="home-button" outline to="/menu" />
          </div>
        </div>
        <img
          class="home-hero-photo"
          :src="heroPhoto"
          alt="فضای گرم کافه با میزهای چوبی و نور پنجره"
          fetchpriority="high"
          width="760"
          height="540"
        />
      </section>

      <h2 class="home-menu-heading">منوی کافه</h2>
      <section class="home-menu" aria-label="اقلام منوی کافه">
        <router-link
          v-for="item in suggestions"
          :key="item.id"
          class="home-menu-card"
          to="/menu"
        >
          <img v-if="menuPhotoFor(item)" :src="menuPhotoFor(item)" :alt="`عکس ${item.title}`" @error="useFallbackMenuPhoto($event, item.id)" loading="lazy" width="400" height="260" />
          <span>{{ item.title }}</span>
        </router-link>
      </section>
    </q-page>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../layouts/MainLayout.vue'
import heroPhoto from '../assets/photos/cafe.webp'
import { computed } from 'vue'
import { menuPhotoFor, useFallbackMenuPhoto } from '../assets/cafePhotos'
import { useBookingStore } from '../stores/bookingStore'
const bookingStore = useBookingStore()
const suggestions = computed(() => bookingStore.menuItems.filter(item => menuPhotoFor(item)).slice(0, 3))
</script>
