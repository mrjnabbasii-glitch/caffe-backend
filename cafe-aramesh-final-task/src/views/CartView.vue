<template>
  <MainLayout>
    <q-page class="page-width cart-page" dir="rtl">
      <h1>سبد خرید</h1>
      <section v-if="order" class="cart-panel" role="status">
        <h2>رسید سفارش</h2>
        <p>سفارش به صندوق ارسال شده است.</p>
        <p>شماره سفارش <bdi dir="ltr">{{ order.orderId }}</bdi></p>
        <p>مبلغ سفارش {{ price(order.total) }} تومان</p>
        <p v-if="!previewMode">پرداخت هنگام تحویل در کافه انجام می‌شه.</p>
        <div class="cart-actions">
          <router-link class="cart-primary" to="/my-orders">مشاهدهٔ سفارش‌های من</router-link>
          <router-link to="/menu">بازگشت به منو</router-link>
          <router-link v-if="previewMode" to="/cashier">مشاهدهٔ صندوق</router-link>
        </div>
      </section>
      <section v-else-if="!cart.items.length" class="cart-panel">
        <p>سبد خرید خالیه.</p>
        <router-link class="cart-primary" to="/menu">مشاهدهٔ منو</router-link>
      </section>
      <section v-else class="cart-panel">
        <p v-if="previewMode">صندوق پیش‌نمایش در همین مرورگر در دسترسه.</p>
        <ul class="cart-lines">
          <li v-for="item in cart.items" :key="item.id">
            <div>
              <strong>{{ item.title }}</strong>
              <div>{{ price(item.price * item.quantity) }} تومان</div>
            </div>
            <div class="cart-controls">
              <button type="button" :aria-label="`افزایش تعداد ${item.title}`"
                :disabled="cart.busy || updating || item.quantity >= cart.maxQuantity" @click="update(() => cart.add(item))">+</button>
              <span :aria-label="`تعداد ${item.title}`">{{ price(item.quantity) }}</span>
              <button type="button" :aria-label="`کاهش تعداد ${item.title}`"
                :disabled="cart.busy || updating" @click="update(() => cart.decrease(item.id))">−</button>
              <button type="button" :aria-label="`حذف ${item.title}`"
                :disabled="cart.busy || updating" @click="update(() => cart.remove(item.id))">حذف</button>
            </div>
          </li>
        </ul>
        <div class="cart-total">
          <strong>جمع سفارش</strong>
          <strong>{{ price(cart.total) }} تومان</strong>
        </div>
        <p v-if="!previewMode">تحویل در کافه و پرداخت هنگام تحویل</p>
        <p v-if="feedback" role="status">{{ feedback }}</p>
        <p v-if="error" class="cart-error" role="alert">{{ error }}</p>
        <div class="cart-actions">
          <button v-if="needsRefresh" type="button" class="cart-primary" :disabled="updating" @click="refresh">
            {{ updating ? 'در حال به‌روزرسانی…' : 'به‌روزرسانی سبد' }}
          </button>
          <button v-else type="button" class="cart-primary" :disabled="cart.busy" @click="submit">
            {{ cart.busy ? 'در حال ثبت…' : (previewMode || auth.isAuthenticated) ? 'ثبت سفارش' : 'ورود و ادامهٔ سفارش' }}
          </button>
          <router-link to="/menu">ادامهٔ انتخاب از منو</router-link>
        </div>
      </section>
    </q-page>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'

import { previewMode } from '../services/api'
const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const order = ref(null)
const error = ref('')
const feedback = ref('')
const needsRefresh = ref(false)
const updating = ref(false)
const price = new Intl.NumberFormat('fa-IR').format

function update(change) {
  change()
  feedback.value = ''
  if (!needsRefresh.value) error.value = ''
}

async function refresh() {
  updating.value = true
  try {
    await cart.refreshPrices()
    error.value = ''
    needsRefresh.value = false
    feedback.value = 'سبد به‌روز شد. اقلام و مبلغ رو بررسی کنید.'
  } catch (cause) {
    error.value = cause.message
  } finally {
    updating.value = false
  }
}

async function submit() {
  if (!previewMode && !auth.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: '/cart' } })
    return
  }
  error.value = ''
  feedback.value = ''
  try {
    order.value = await cart.placeOrder()
  } catch (cause) {
    error.value = cause.message
    needsRefresh.value = cause.status === 409
  }
}
</script>

<style scoped>
.cart-page { color: #fff4e0; max-width: 790px; padding-block: clamp(28px, 5vw, 64px); }
h1 { font-size: clamp(28px, 5vw, 42px); line-height: 1.35; margin: 0 0 20px; font-weight: 800; }
h2 { font-size: 22px; line-height: 1.4; margin: 0 0 14px; }
.cart-panel { background: #102619; border: 1px solid #8c714a; border-radius: 18px; padding: clamp(14px, 4vw, 30px); }
.cart-lines { list-style: none; margin: 0; padding: 0; }
.cart-lines li, .cart-total { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; padding-block: 14px; border-bottom: 1px solid #816d4c; }
.cart-total { margin-bottom: 12px; }
.cart-controls, .cart-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cart-controls button, .cart-primary { min-height: 44px; border: 1px solid #d8b675; border-radius: 8px; font: inherit; cursor: pointer; }
.cart-controls button { background: #203b28; color: #fff4e0; min-width: 44px; }
.cart-primary { display: inline-flex; align-items: center; padding: 8px 16px; background: #f3ce8a; color: #281b0e; font-weight: 800; text-decoration: none; }
.cart-actions > a:not(.cart-primary) { color: #ffdfa4; padding: 9px; }
button:not(:disabled):hover, a:hover { filter: brightness(1.12); }
button:focus-visible, a:focus-visible { outline: 2px solid #ffe0a6; outline-offset: 3px; }
button:disabled { opacity: .6; cursor: default; }
.cart-error { color: #ffbca9; }
</style>
