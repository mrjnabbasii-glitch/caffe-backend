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

      <section v-for="(section, sectionIndex) in visibleSections" :key="section.title" class="cafe-menu-section">
        <h2>{{ section.title }}</h2>
        <p v-if="section.title === 'پیتزاها'">با خمیر سبک ناپولیتن</p>
        <div class="cafe-menu-grid">
          <article v-for="(item, index) in section.items" :key="item.id" class="cafe-menu-item">
            <div class="menu-photo">
              <img
                v-if="menuPhotoFor(item) && !failedPhotos.has(item.id)"
                :src="menuPhotoFor(item)"
                :alt="`عکس ${item.title}`"
                :loading="sectionIndex === 0 && index < 2 ? 'eager' : 'lazy'"
                :fetchpriority="sectionIndex === 0 && index === 0 ? 'high' : 'auto'"
                decoding="async"
                width="500"
                height="330"
                @error="failedPhotos.add(item.id)"
              />
              <span v-else aria-hidden="true">{{ item.icon || '🍽️' }}</span>
            </div>
            <div class="cafe-menu-item-body">
              <h3>{{ item.title }}</h3>
              <p>ترکیبات: {{ item.description }}</p>
              <strong>{{ item.price.toLocaleString('fa-IR') }} تومان</strong>
              <div
                v-if="quantities.get(item.id)"
                class="menu-quantity"
                role="group"
                :aria-label="`تعداد ${item.title} در سبد`"
              >
                <button type="button" :aria-label="`کاهش تعداد ${item.title}`"
                  :disabled="cart.busy" @click="cart.decrease(item.id)">−</button>
                <output aria-live="polite">{{ quantities.get(item.id).toLocaleString('fa-IR') }}</output>
                <button type="button" :aria-label="`افزایش تعداد ${item.title}`"
                  :disabled="cart.busy || quantities.get(item.id) >= cart.maxQuantity"
                  @click="cart.add(item)">+</button>
              </div>
              <button
                v-else
                type="button"
                class="menu-add"
                :aria-label="`افزودن ${item.title} به سبد خرید`"
                :disabled="cart.busy"
                @click="addToCart(item)"
              >
                <span aria-hidden="true">+</span>
                افزودن به سبد
              </button>
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
import { computed, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import MainLayout from '../layouts/MainLayout.vue'
import { menuPhotoFor } from '../assets/cafePhotos'
import { useBookingStore } from '../stores/bookingStore'

import { useCartStore } from '../stores/cartStore'

const bookingStore = useBookingStore()
const cart = useCartStore()
const quantities = computed(() => new Map(cart.items.map(({ id, quantity }) => [id, quantity])))
const $q = useQuasar()
const failedPhotos = reactive(new Set())

function addToCart(item) {
  if (cart.add(item)) {
    $q.notify({ type: 'positive', message: `${item.title} به سبد اضافه شد.`, timeout: 1100 })
  } else {
    $q.notify({ type: 'warning', message: 'به حداکثر تعداد مجاز در سبد خرید رسیدید.' })
  }
}

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

<style scoped>
.cafe-menu-item { display: flex; flex-direction: column; }
.menu-photo {
  aspect-ratio: 500 / 330;
  background: #243a27;
  display: grid;
  place-items: center;
  font-size: 32px;
}
.menu-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.menu-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 44px;
  margin-top: 8px;
  padding: 5px 4px;
  border: 1px solid #ffdfa4;
  border-radius: 9px;
  background: #f3ce8a;
  color: #281b0e;
  font: inherit;
  font-size: clamp(12px, 1.15vw, 15px);
  font-weight: 800;
  cursor: pointer;
}
.menu-add:not(:disabled):hover { background: #ffdfa4; }
.menu-quantity {
  display: grid;
  grid-template-columns: minmax(44px, 1fr) auto minmax(44px, 1fr);
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  text-align: center;
}
.menu-quantity output { min-width: 1.8em; font-weight: 800; }
.menu-quantity button {
  min-height: 44px;
  border: 1px solid #ffdfa4;
  border-radius: 9px;
  background: #f3ce8a;
  color: #281b0e;
  font: inherit;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
}
.menu-quantity button:disabled { opacity: .6; cursor: default; }
.menu-quantity button:not(:disabled):hover { background: #ffdfa4; }
.menu-quantity button:focus-visible,
.menu-add:focus-visible { outline: 2px solid #ffe6b7; outline-offset: 3px; }
.menu-add:disabled { opacity: .6; cursor: default; }
</style>
