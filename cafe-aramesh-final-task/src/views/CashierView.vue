<template>
  <MainLayout>
    <q-page class="page-width cashier-page" dir="rtl">
      <header>
        <h1>صندوق</h1>
        <button type="button" :disabled="loading" @click="refresh">به‌روزرسانی سفارش‌ها</button>
      </header>
      <p v-if="previewMode">سفارش‌های ثبت‌شده در پیش‌نمایش همین مرورگر</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-else-if="loading && !orders.length" role="status">در حال دریافت سفارش‌ها…</p>
      <p v-else-if="!orders.length">هنوز سفارشی ثبت نشده است.</p>
      <article v-for="order in orders" :key="order.orderId">
        <h2>سفارش <bdi>{{ order.orderId }}</bdi></h2>
        <time :datetime="order.createdAt">{{ timestamp.format(new Date(order.createdAt)) }}</time>
        <ul>
          <li v-for="item in order.items" :key="item.id">
            {{ item.title }} · {{ price.format(item.quantity) }} عدد
          </li>
        </ul>
        <strong>جمع سفارش {{ price.format(order.total) }} تومان</strong>
      </article>
    </q-page>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { previewMode, request } from '../services/api'

const orders = ref([])
const error = ref('')
const loading = ref(false)
const price = new Intl.NumberFormat('fa-IR')
const timestamp = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const result = await request('get', '/orders/cashier')
    orders.value = result.orders
  } catch (cause) {
    orders.value = []
    error.value = cause.message
  } finally {
    loading.value = false
  }
}

onMounted(refresh)
</script>

<style scoped>
.cashier-page { width: min(100%, 800px); padding-block: 36px; color: #fff4e0; }
header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
h1 { font-size: 32px; line-height: 1.3; }
h2 { margin: 0 0 4px; font-size: 18px; line-height: 1.5; }
article { margin-block: 14px; padding: 16px; background: #102619; border: 1px solid #8c714a; border-radius: 12px; }
button { min-height: 44px; padding: 8px 12px; border: 0; border-radius: 8px; background: #f3ce8a; color: #281b0e; font: inherit; cursor: pointer; }
button:focus-visible { outline: 2px solid #ffe0a6; outline-offset: 3px; }
</style>
