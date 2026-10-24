<template>
  <MainLayout>
    <q-page class="page-width q-py-xl">
      <div class="text-h4 text-center text-weight-bold cafe-brown q-mb-xl">
        منوی کافه آرامش
      </div>

      <section v-for="section in menuSections" :key="section.title" class="q-mb-xl">
        <div class="text-h5 text-weight-bold q-mb-md">{{ section.title }}</div>

        <div class="row q-col-gutter-lg">
          <div
            v-for="item in section.items"
            :key="item.title"
            class="col-12 col-sm-6 col-md-4"
          >
            <q-card class="cafe-card text-center" flat bordered>
              <q-card-section>
                <div class="text-h2">{{ item.icon }}</div>
                <div class="text-h6 q-mt-sm">{{ item.title }}</div>
                <div class="text-body2 q-mt-sm">{{ item.description }}</div>
                <div class="text-subtitle1 text-weight-bold text-brown-8 q-mt-md">
                  {{ item.price.toLocaleString('fa-IR') }} تومان
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </section>
    </q-page>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../layouts/MainLayout.vue'
import { computed } from 'vue'
import { useBookingStore } from '../stores/bookingStore'

const bookingStore = useBookingStore()
const menuSections = computed(() => {
  const groups = new Map()
  for (const item of bookingStore.menuItems) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category).push(item)
  }
  return [...groups].map(([title, items]) => ({ title, items }))
})
</script>
