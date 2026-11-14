import { Router } from 'express'
import { handle } from '../../controllers/menu/get-menu.controller.js'

export default function createGetMenuRouter() {
  const router = Router()
  router.get('/', handle)
  return router
}
