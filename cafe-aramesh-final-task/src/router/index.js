import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const authView = () => import('../views/AuthView.vue')

const routes = [
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/menu', component: () => import('../views/MenuView.vue') },
  { path: '/tables', component: () => import('../views/TablesView.vue') },
  {
    path: '/login',
    name: 'login',
    component: authView,
    props: { mode: 'login' },
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'register',
    component: authView,
    props: { mode: 'register' },
    meta: { guestOnly: true }
  },
  {
    path: '/reservation',
    component: () => import('../views/ReservationView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-reservations',
    component: () => import('../views/MyReservationsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/receipt/:bookingId',
    name: 'receipt',
    component: () => import('../views/ReceiptPage.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/forgot-password', component: authView, props: { mode: 'forgot-password' } },
  { path: '/reset-password', component: authView, props: { mode: 'reset-password' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]
// Only allows redirects to our own known pages, so a crafted link like
// /login?redirect=//evil.example cannot send the user to another site after login.
export function safeRedirect(value) {
  if (typeof value !== 'string' || !/^\/(?![\/\\])/.test(value) || /[\\\s]/.test(value))
    return '/my-reservations'
  const pathname = value.split(/[?#]/)[0]
  return ['/', '/menu', '/tables', '/reservation', '/my-reservations'].includes(pathname) ||
    /^\/receipt\/CAFE-[A-F0-9]{24}$/.test(pathname)
    ? value
    : '/my-reservations'
}
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
// Runs before every navigation: restores the session once, then checks route access.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  try {
    await auth.restore()
  } catch {
    /* The page shows connection failures and allows retrying login. */
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.isAuthenticated) return safeRedirect(to.query.redirect)
})
export default router
