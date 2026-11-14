import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const initialized = ref(false)
  const busy = ref(false)
  let pending
  const isAuthenticated = computed(() => Boolean(user.value))
  async function restore() {
    if (initialized.value) return
    if (!pending)
      pending = (async () => {
        try {
          user.value = (await request('get', '/auth/me')).user
          initialized.value = true
        } catch (error) {
          if (error.status !== 401) throw error
          user.value = null
          initialized.value = true
        } finally {
          pending = null
        }
      })()
    return pending
  }
  async function authenticate(action, input) {
    busy.value = true
    try {
      user.value = (await request('post', '/auth/' + action, input)).user
      initialized.value = true
    } finally {
      busy.value = false
    }
  }
  async function logout() {
    await request('post', '/auth/logout')
    clear()
  }
  function clear() {
    user.value = null
    initialized.value = true
  }
  return { user, busy, initialized, isAuthenticated, restore, authenticate, logout, clear }
})
