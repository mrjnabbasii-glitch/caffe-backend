import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/menu',
    component: () => import('../views/MenuView.vue')
  },
  {
    path: '/tables',
    component: () => import('../views/TablesView.vue')
  },
  {
    path: '/reservation',
    component: () => import('../views/ReservationView.vue')
  },
  {
    path: '/my-reservations',
    component: () => import('../views/MyReservationsView.vue')
  },
  {
    path: '/receipt/:bookingId',
    name: 'receipt',
    component: () => import('../views/ReceiptPage.vue')
  }
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})