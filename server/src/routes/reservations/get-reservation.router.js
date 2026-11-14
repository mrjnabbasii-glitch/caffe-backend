import { Router } from 'express'
import { requireAuth } from '../auth.routes.js'
import { handle } from '../../controllers/reservations/get-reservation.controller.js'

export default function createGetReservationRouter() {
  const router = Router({ mergeParams: true })
  router.get('/', requireAuth, handle)
  return router
}
