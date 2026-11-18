import { Router } from 'express'
import { requireAuth } from '../auth.routes.js'
import { Order } from '../../models/order.model.js'
import { fail } from '../../utils/http-error.js'
import { createOrder } from '../../services/orders/create-order.service.js'

const historyPageSize = 20

function orderDetails({ _id, items, total, createdAt }) {
  return { orderId: _id.toString().toUpperCase(), items, total, createdAt }
}

export default function createOrderRouter() {
  const router = Router()
  router.get('/mine', requireAuth, async (req, res) => {
    const { before } = req.query
    const filter = { ownerHash: req.ownerHash }
    if (before !== undefined) {
      if (typeof before !== 'string' || !/^[a-f0-9]{24}$/i.test(before)) {
        fail(400, 'شناسهٔ صفحهٔ سفارش‌ها معتبر نیست.')
      }
      filter._id = { $lt: before }
    }

    const rows = await Order.find(filter)
      .select('items total createdAt')
      .sort({ _id: -1 })
      .limit(historyPageSize + 1)
      .lean()
    const orders = rows.slice(0, historyPageSize).map(orderDetails)
    res.json({
      orders,
      nextCursor: rows.length > historyPageSize ? orders.at(-1).orderId : null
    })
  })

  router.get('/cashier', requireAuth, async (req, res) => {
    const cashierIds = (process.env.CASHIER_USER_IDS ?? '').split(',').map((id) => id.trim())
    if (!cashierIds.includes(req.user._id.toString())) {
      fail(403, 'این حساب به صندوق دسترسی ندارد.')
    }

    const orders = await Order.find()
      .select('items total createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean()
    res.json({ orders: orders.map(orderDetails) })
  })
  router.post('/', requireAuth, async (req, res) => {
    const { order, created } = await createOrder(req.ownerHash, req.body ?? {})
    res.status(created ? 201 : 200).json({ order })
  })
  return router
}
