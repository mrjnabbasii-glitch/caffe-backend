import { Router } from 'express'
import { createAuthRouter } from './auth.routes.js'
import createHealthRouter from './health/health.router.js'
import createGetMenuRouter from './menu/get-menu.router.js'
import createListTablesRouter from './tables/list-tables.router.js'
import createLockTableRouter from './tables/lock-table.router.js'
import createReleaseTableRouter from './tables/release-table.router.js'
import createCreateReservationRouter from './reservations/create-reservation.router.js'
import createListReservationsRouter from './reservations/list-reservations.router.js'
import createGetReservationRouter from './reservations/get-reservation.router.js'

// Maps every URL under /api to its own small router file.
export default function createApiRouter({ sendResetEmail } = {}) {
  const router = Router()
  router.use('/auth', createAuthRouter({ sendResetEmail }))
  router.use('/health', createHealthRouter())
  router.use('/menu', createGetMenuRouter())
  router.use('/tables', createListTablesRouter())
  router.use('/tables/:id/lock', createLockTableRouter())
  router.use('/tables/:id/lock', createReleaseTableRouter())
  router.use('/reservations', createCreateReservationRouter())
  router.use('/reservations', createListReservationsRouter())
  router.use('/reservations/:bookingId', createGetReservationRouter())
  return router
}
