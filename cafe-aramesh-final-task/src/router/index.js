import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { previewMode } from '../services/api'

const authView = () => import('../views/AuthView.vue')

const routes = [
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/menu', component: () => import('../views/MenuView.vue') },
  { path: '/cart', component: () => import('../views/CartView.vue') },
  {
    path: '/cashier',
    component: () => import('../views/CashierView.vue'),
    meta: { requiresAuth: !previewMode }
  },
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
    path: '/my-orders',
    component: () => import('../views/MyOrdersView.vue'),
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
    return '/'
  const pathname = value.split(/[?#]/)[0]
  return ['/', '/menu', '/cart', '/cashier', '/tables', '/reservation', '/my-reservations', '/my-orders'].includes(pathname) ||
    /^\/receipt\/CAFE-[A-F0-9]{24}$/.test(pathname)
    ? value
    : '/'
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
