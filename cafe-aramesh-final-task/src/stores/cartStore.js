import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../services/api'

const storageKey = 'cafe-aramesh:cart'
const maxQuantity = 20
const maxItems = 50

function restoreCart() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? {}
  } catch {
    return {}
  }
}

export const useCartStore = defineStore('cart', () => {
  const saved = restoreCart()
  const items = ref(Array.isArray(saved.items) ? saved.items : [])
  const checkout = ref(saved.checkout ?? null)
  const busy = ref(false)
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

  watch([items, checkout], () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ items: items.value, checkout: checkout.value }))
    } catch {
      // Cart interactions still work if the browser blocks storage.
    }
  }, { deep: true, flush: 'sync' })

  function add(item) {
    if (busy.value) return false
    const line = items.value.find(({ id }) => id === item.id)
    if (line?.quantity >= maxQuantity || (!line && items.value.length >= maxItems)) return false
    checkout.value = null
    if (line) line.quantity += 1
    else items.value.push({ id: item.id, title: item.title, price: item.price, quantity: 1 })
    return true
  }

  function remove(id) {
    if (busy.value) return
    checkout.value = null
    items.value = items.value.filter((item) => item.id !== id)
  }

  function decrease(id) {
    if (busy.value) return
    const item = items.value.find((line) => line.id === id)
    if (!item) return
    if (item.quantity === 1) remove(id)
    else {
      checkout.value = null
      item.quantity -= 1
    }
  }

  async function refreshPrices() {
    const { items: menu } = await request('get', '/menu')
    const available = new Map(menu.map((item) => [item.id, item]))
    items.value = items.value.flatMap((line) => {
      const current = available.get(line.id)
      return current ? [{ ...line, price: current.price, title: current.title }] : []
    })
    checkout.value = null
  }

  async function placeOrder() {
    if (!items.value.length || busy.value) return
    busy.value = true
    try {
      checkout.value ??= {
        checkoutKey: Array.from(crypto.getRandomValues(new Uint8Array(18)), (byte) =>
          byte.toString(16).padStart(2, '0')).join(''),
        expectedTotal: total.value,
        items: items.value.map(({ id, quantity }) => ({ id, quantity }))
      }
      const { order } = await request('post', '/orders', checkout.value)
      items.value = []
      checkout.value = null
      return order
    } finally {
      busy.value = false
    }
  }

  return { items, busy, count, total, maxQuantity, add, remove, decrease, refreshPrices, placeOrder }
})
