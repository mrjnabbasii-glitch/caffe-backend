import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'
import fa from 'quasar/lang/fa'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'
import '@fontsource-variable/vazirmatn'
import './assets/main.css'
import './assets/forest-walnut.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'
import { useBookingStore } from './stores/bookingStore'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: { Notify },
  lang: fa,
  config: {
    brand: { primary: '#53692e', secondary: '#ac7d50', accent: '#b99b62' },
    notify: {
      position: 'top',
      timeout: 3000
    }
  }
})

// Fired by services/api.js when the server answers 401 (expired or revoked session).
window.addEventListener('cafe:unauthorized', () => {
  useAuthStore().clear()
  useBookingStore().clearPrivateData()
  if (router.currentRoute.value.meta.requiresAuth)
    router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
})
app.mount('#app')
