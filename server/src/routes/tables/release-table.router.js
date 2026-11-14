import { Router } from 'express'
import { requireAuth } from '../auth.routes.js'
import { handle } from '../../controllers/tables/release-table.controller.js'

export default function createReleaseTableRouter() {
  const router = Router({ mergeParams: true })
  router.delete('/', requireAuth, handle)
  return router
}
