import { randomBytes } from 'node:crypto'
import { Table } from '../../models/table.model.js'
import { MenuItem } from '../../models/menu-item.model.js'
import { fail } from '../../utils/http-error.js'

// Prices always come from the database; the client only sends ids and quantities.
async function priceAddons(addons) {
  const products = await MenuItem.find({
    id: { $in: addons.map((item) => item.id) },
    isAddon: true,
    available: true
  }).lean()
  // The DTO already rejects duplicate ids, so a length mismatch means an item is unavailable.
  if (products.length !== addons.length) fail(400, 'بعضی اقلام پذیرایی در دسترس نیستند.')

  return addons.map((item) => {
    const product = products.find((p) => p.id === item.id)
    return { id: product.id, title: product.title, price: product.price, quantity: item.quantity }
  })
}

export async function createReservation({ id, customerName, bookingTime, addons }, ownerHash) {
  const table = await Table.findOne({ id }).lean()
  if (!table) fail(404, 'میز پیدا نشد.')
  // Idempotent retry: if the first response was lost, return the same booking, not a duplicate.
  if (table.reservation?.ownerHash === ownerHash) return { created: false, reservation: table }

  const pricedAddons = await priceAddons(addons)
  const addonsTotal = pricedAddons.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const reservation = {
    bookingId: `CAFE-${randomBytes(12).toString('hex').toUpperCase()}`,
    ownerHash,
    customerName,
    bookingTime,
    addons: pricedAddons,
    tablePrice: table.price,
    totalPrice: table.price + addonsTotal,
    createdAt: new Date()
  }

  // Atomic check-and-set: succeeds only if the table is still free AND this user holds
  // a valid lock. Two simultaneous requests can never both pass this filter.
  const updated = await Table.findOneAndUpdate(
    { id, reservation: null, lockOwner: ownerHash, lockUntil: { $gt: new Date() } },
    { $set: { reservation, lockOwner: null, lockUntil: null } },
    { returnDocument: 'after', runValidators: true }
  ).lean()
  if (!updated) fail(409, 'زمان رزرو موقت تمام شده یا میز دیگر در دسترس نیست.')
  return { created: true, reservation: updated }
}
