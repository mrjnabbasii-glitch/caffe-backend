import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../services/api'
import { useAuthStore } from './authStore'

export const useBookingStore = defineStore('booking', () => {
  const auth = useAuthStore()
  const tables = ref([])
  const menuItems = ref([])
  const timeOptions = ref([])
  const selectedTable = ref(null)
  const bookingTime = ref('')
  const addons = ref([])
  const customer = ref({ name: '' })
  const temporaryLock = ref(false)
  const expiresAt = ref(null)
  const reservations = ref([])
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  let initialization // Shared promise: parallel initialize() calls reuse one request.
  const addonsList = computed(() => menuItems.value.filter((item) => item.isAddon))
  // Shown in the booking dialog only; the server recalculates the real price.
  const tablePrice = computed(() => selectedTable.value?.price || 0)
  const addonsTotal = computed(() =>
    addons.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  const totalPrice = computed(() => tablePrice.value + addonsTotal.value)

  async function refreshTables() {
    const data = await request('get', '/tables')
    tables.value = data.tables
  }
  async function loadReservations() {
    if (!auth.isAuthenticated) {
      reservations.value = []
      return
    }
    const userId = auth.user.id
    const data = await request('get', '/reservations')
    // Ignore the answer if a different user logged in while the request was in flight.
    if (auth.user?.id !== userId) return
    reservations.value = data.reservations
  }
  async function initialize() {
    if (initialization) return initialization
    loading.value = true
    error.value = ''
    initialization = (async () => {
      try {
        const [menu] = await Promise.all([
          request('get', '/menu'),
          refreshTables(),
          loadReservations()
        ])
        menuItems.value = menu.items
        timeOptions.value = menu.timeOptions
      } catch (cause) {
        error.value = cause.message
      } finally {
        loading.value = false
        initialization = null
      }
    })()
    return initialization
  }
  async function selectTable(table) {
    if (busy.value || temporaryLock.value || table.isReserved || table.isLocked) return false
    busy.value = true
    try {
      const data = await request('post', `/tables/${table.id}/lock`)
      selectedTable.value = data.table
      expiresAt.value = data.expiresAt
      temporaryLock.value = true
      bookingTime.value = ''
      customer.value = { name: auth.user?.name || '' }
      addons.value = []
      tables.value = tables.value.map((item) => (item.id === table.id ? data.table : item))
      return true
    } finally {
      busy.value = false
    }
  }
  async function releaseSelectedTable() {
    const table = selectedTable.value
    const shouldRelease = temporaryLock.value
    selectedTable.value = null
    temporaryLock.value = false
    expiresAt.value = null
    if (table && shouldRelease) await request('delete', `/tables/${table.id}/lock`)
    await refreshTables()
  }
  async function saveReservation() {
    if (!selectedTable.value || !temporaryLock.value || busy.value) return null
    const table = selectedTable.value
    busy.value = true
    try {
      const { reservation } = await request('post', '/reservations', {
        tableId: table.id,
        customerName: customer.value.name,
        bookingTime: bookingTime.value,
        addons: addons.value.map(({ id, quantity }) => ({ id, quantity }))
      })
      temporaryLock.value = false
      expiresAt.value = null
      selectedTable.value = { ...table, isReserved: true, isLocked: false }
      tables.value = tables.value.map((item) =>
        item.id === selectedTable.value.id ? selectedTable.value : item
      )
      reservations.value = [
        reservation,
        ...reservations.value.filter((item) => item.bookingId !== reservation.bookingId)
      ]
      return reservation
    } finally {
      busy.value = false
    }
  }
  async function getReservation(id) {
    const { reservation } = await request('get', `/reservations/${encodeURIComponent(id)}`)
    return reservation
  }
  function clearPrivateData() {
    selectedTable.value = null
    temporaryLock.value = false
    expiresAt.value = null
    reservations.value = []
    customer.value = { name: '' }
    addons.value = []
    bookingTime.value = ''
    error.value = ''
  }
  return {
    clearPrivateData,
    tables,
    menuItems,
    addonsList,
    timeOptions,
    selectedTable,
    bookingTime,
    addons,
    customer,
    temporaryLock,
    expiresAt,
    reservations,
    loading,
    busy,
    error,
    totalPrice,
    initialize,
    refreshTables,
    loadReservations,
    selectTable,
    releaseSelectedTable,
    saveReservation,
    getReservation
  }
})
