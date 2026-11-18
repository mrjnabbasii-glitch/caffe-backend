<template>
  <MainLayout>
    <q-page class="page-width orders-page" dir="rtl">
      <h1 class="cafe-heading">سفارش‌های من</h1>

      <p v-if="error" role="alert">{{ error }}</p>
      <p v-else-if="loading && !orders.length" role="status">در حال دریافت سفارش‌ها…</p>
      <section v-else-if="!orders.length" class="cafe-card order-card">
        <p>هنوز سفارشی ثبت نکرده‌اید.</p>
        <q-btn label="دیدن منو" to="/menu" class="cafe-btn text-white" unelevated />
      </section>

      <article v-for="order in orders" :key="order.orderId" class="cafe-card order-card">
        <header class="order-header">
          <h2>سفارش <bdi dir="ltr">{{ order.orderId }}</bdi></h2>
          <time :datetime="order.createdAt">{{ timestamp.format(new Date(order.createdAt)) }}</time>
        </header>
        <ul class="order-lines">
          <li v-for="item in order.items" :key="item.id">
            <span>{{ item.title }} × {{ price.format(item.quantity) }}</span>
            <span>{{ price.format(item.unitPrice * item.quantity) }} تومان</span>
          </li>
        </ul>
        <div class="order-total">
          <span>مبلغ کل</span>
          <strong>{{ price.format(order.total) }} تومان</strong>
        </div>
      </article>

      <q-btn
        v-if="error || nextCursor"
        :label="error ? 'تلاش دوباره' : 'نمایش سفارش‌های بیشتر'"
        :loading="loading"
        class="cafe-btn text-white"
        unelevated
        @click="loadOrders"
      />
    </q-page>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { request } from '../services/api'

const orders = ref([])
const nextCursor = ref(null)
const error = ref('')
const loading = ref(true)
const price = new Intl.NumberFormat('fa-IR')
const timestamp = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran'
})

async function loadOrders() {
  loading.value = true
  error.value = ''
  try {
    const cursor = nextCursor.value
    const url = cursor ? `/orders/mine?before=${encodeURIComponent(cursor)}` : '/orders/mine'
    const result = await request('get', url)
    orders.value = cursor ? [...orders.value, ...result.orders] : result.orders
    nextCursor.value = result.nextCursor
  } catch (cause) {
    error.value = cause.message
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)
</script>

<style scoped>
.orders-page { max-width: 790px; padding-block: clamp(24px, 5vw, 56px); }
h1 { margin: 0 0 24px; font-size: clamp(28px, 5vw, 40px); line-height: 1.4; font-weight: 800; }
.order-card { margin-bottom: 14px; padding: clamp(14px, 4vw, 24px); }
.order-header, .order-lines li, .order-total {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
}
h2 { margin: 0; font-size: 1rem; line-height: 1.6; overflow-wrap: anywhere; }
time { font-size: .875rem; color: var(--cafe-muted); }
.order-lines { list-style: none; margin: 12px 0 0; padding: 0; }
.order-lines li, .order-total { border-top: 1px solid var(--cafe-border); padding-block: 10px; }
.order-total { padding-bottom: 0; }
</style>
