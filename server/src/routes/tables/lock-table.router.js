import { Router } from 'express'
import { requireAuth } from '../auth.routes.js'
import { handle } from '../../controllers/tables/lock-table.controller.js'

export default function createLockTableRouter() {
  // mergeParams: lets this router read :id from the parent path /tables/:id/lock.
  const router = Router({ mergeParams: true })
  router.post('/', requireAuth, handle)
  return router
}
