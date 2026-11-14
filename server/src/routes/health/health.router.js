import { Router } from 'express'
import { handle } from '../../controllers/health/health.controller.js'

export default function createHealthRouter() {
  const router = Router()
  router.get('/', handle)
  return router
}
