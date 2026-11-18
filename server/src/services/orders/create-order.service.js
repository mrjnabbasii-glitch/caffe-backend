import { MenuItem } from '../../models/menu-item.model.js'
import { Order } from '../../models/order.model.js'
import { fail } from '../../utils/http-error.js'

export async function createOrder(ownerHash, { checkoutKey, items, expectedTotal } = {}) {
  if (
    typeof checkoutKey !== 'string' || !/^[a-f0-9]{36}$/.test(checkoutKey) ||
    !Number.isSafeInteger(expectedTotal) || expectedTotal < 0 ||
    !Array.isArray(items) || items.length < 1 || items.length > 50 ||
    items.some((line) => !Number.isSafeInteger(line?.id) || line.id < 1 ||
      !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) ||
    new Set(items.map(({ id }) => id)).size !== items.length
  ) {
    throw fail(400, 'اطلاعات سبد خرید معتبر نیست.')
  }

  const lookup = { ownerHash, checkoutKey }
  const existing = await Order.findOne(lookup).lean()
  if (existing) return replayOrder(existing, items, expectedTotal)
  const menuItems = await MenuItem.find({ id: { $in: items.map(({ id }) => id) }, available: true })
    .select('id title price').lean()
  const menuById = new Map(menuItems.map((item) => [item.id, item]))
  const lines = items.map(({ id, quantity }) => {
    const item = menuById.get(id)
    if (!item || !Number.isSafeInteger(item.price) || item.price < 0)
      throw fail(409, 'بعضی از اقلام سبد دیگه موجود نیستن. سبد رو به‌روزرسانی کنید.')
    return { id, title: item.title, unitPrice: item.price, quantity }
  })
  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  if (total !== expectedTotal)
    throw fail(409, 'قیمت بعضی از اقلام تغییر کرده. مبلغ جدید رو در سبد بررسی کنید.')

  try {
    const order = await Order.create({ ...lookup, items: lines, total })
    return { order: publicOrder(order), created: true }
  } catch (error) {
    if (error.code !== 11000) throw error
    return replayOrder(await Order.findOne(lookup).lean(), items, expectedTotal)
  }
}

function replayOrder(order, items, expectedTotal) {
  const quantities = new Map(items.map(({ id, quantity }) => [id, quantity]))
  if (order.total !== expectedTotal || order.items.length !== items.length ||
      order.items.some((line) => quantities.get(line.id) !== line.quantity))
    throw fail(409, 'این شناسه قبلاً برای سبد دیگری استفاده شده است.')
  return { order: publicOrder(order), created: false }
}

function publicOrder(order) {
  return {
    orderId: order._id.toString().toUpperCase(),
    total: order.total,
    paymentMethod: 'pay_at_pickup'
  }
}
