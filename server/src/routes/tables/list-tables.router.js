import { Router } from 'express'
import { handle } from '../../controllers/tables/list-tables.controller.js'

export default function createListTablesRouter() {
  const router = Router()
  router.get('/', handle)
  return router
}
