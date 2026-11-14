<template>
  <MainLayout>
    <q-page class="page-width cafe-menu-page">
      <header class="cafe-menu-heading">
        <h1>منوی کافه آرامش</h1>
        <p>نوشیدنی، دسر و غذا برای هر سلیقه</p>
      </header>

      <div class="booking-options capacity-options" role="group" aria-label="دسته‌بندی منو">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          :aria-pressed="activeCategory === category"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <section v-for="section in visibleSections" :key="section.title" class="cafe-menu-section">
        <h2>{{ section.title }}</h2>
        <p v-if="section.title === 'پیتزاها'">با خمیر سبک ناپولیتن</p>
        <div class="cafe-menu-grid">
          <article v-for="item in section.items" :key="item.id" class="cafe-menu-item">
            <img
              v-if="menuPhotoFor(item)"
              :src="menuPhotoFor(item)"
              :alt="`عکس ${item.title}`"
              @error="useFallbackMenuPhoto($event, item.id)"
              loading="lazy"
              width="500"
              height="330"
            />
            <div v-else class="cafe-menu-icon" aria-hidden="true">{{ item.icon }}</div>
            <div class="cafe-menu-item-body">
              <h3>{{ item.title }}</h3>
              <p>ترکیبات: {{ item.description }}</p>
              <strong>{{ item.price.toLocaleString('fa-IR') }} تومان</strong>
            </div>
          </article>
        </div>
      </section>
      <p
        v-if="!bookingStore.loading && !bookingStore.error && !visibleSections.length"
        class="booking-empty"
      >
        فعلاً آیتمی در منو موجود نیست.
      </p>
    </q-page>
  </MainLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { menuPhotoFor, useFallbackMenuPhoto } from '../assets/cafePhotos'
import { useBookingStore } from '../stores/bookingStore'

const bookingStore = useBookingStore()
const activeCategory = ref('همه')

function displayCategory(item) {
  const category = String(item.category || '').trim()
  if (!category.startsWith('نوشیدنی')) return category
  if (category.includes('سرد')) return 'نوشیدنی‌های سرد'
  if (category.includes('گرم')) return 'نوشیدنی‌های گرم'
  // Support the old, single-category API without changing its data.
  const name = String(item.title || '').replaceAll('ي', 'ی')
  return /(ایس|آیس|موهیتو|لیموناد|اسموتی|آب معدنی|شیک|کولد|نوشابه|سرد)/.test(name)
    ? 'نوشیدنی‌های سرد'
    : 'نوشیدنی‌های گرم'
}
const menuSections = computed(() => {
  const groups = new Map()
  for (const item of bookingStore.menuItems) {
    // UI-only categorization: do NOT change menu items, prices, or MongoDB records.
    const category = displayCategory(item)
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category).push(item)
  }
  const order = ['نوشیدنی‌های گرم', 'نوشیدنی‌های سرد', 'کیک و کوکی', 'برگرها', 'پنینی‌ها', 'پاستاها', 'سالادها', 'پیتزاها']
  return [...groups].map(([title, items]) => ({
    title,
    items: [...items].sort(
      (a, b) => Number(Boolean(menuPhotoFor(b))) - Number(Boolean(menuPhotoFor(a)))
    )
  })).sort((a, b) => {
    const rank = (category) => order.indexOf(category) === -1 ? order.length : order.indexOf(category)
    return rank(a.title) - rank(b.title)
  })
})
const categories = computed(() => {
  const values = ['همه']
  for (const { title } of menuSections.value) {
    const category = title === 'نوشیدنی‌های گرم' || title === 'نوشیدنی‌های سرد'
      ? 'نوشیدنی‌ها' : title
    if (!values.includes(category)) values.push(category)
  }
  return values
})
const visibleSections = computed(() => {
  if (activeCategory.value === 'همه') return menuSections.value
  if (activeCategory.value === 'نوشیدنی‌ها') {
    return menuSections.value.filter(({ title }) =>
      title === 'نوشیدنی‌های گرم' || title === 'نوشیدنی‌های سرد')
  }
  return menuSections.value.filter(({ title }) => title === activeCategory.value)
})
</script>
