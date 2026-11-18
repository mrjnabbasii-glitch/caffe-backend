<template>
  <router-link
    class="cart-link"
    to="/cart"
    :aria-label="`سبد خرید، ${cart.count.toLocaleString('fa-IR')} قلم`"
  >
    <q-icon name="shopping_cart" size="21px" aria-hidden="true" />
    <span class="cart-link-title">سبد خرید</span>
    <span class="cart-link-count" aria-hidden="true">{{ cart.count.toLocaleString('fa-IR') }}</span>
  </router-link>
</template>

<script setup>
import { useCartStore } from '../stores/cartStore'
const cart = useCartStore()
</script>

<style scoped>
.cart-link {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding-inline: 9px;
  flex-shrink: 0;
  border: 1px solid #e6be76;
  border-radius: 10px;
  background: #182e1e;
  color: #fff4dd;
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
}
.cart-link:hover, .cart-link.router-link-active { background: #29472c; }
.cart-link:focus-visible { outline: 2px solid #f9d689; outline-offset: 3px; }
.cart-link-count {
  min-width: 1.45rem;
  padding-inline: 3px;
  border-radius: 1rem;
  background: #f3cd87;
  color: #292211;
  text-align: center;
}
@media (max-width: 720px) { .cart-link-title { display: none; } }
</style>
