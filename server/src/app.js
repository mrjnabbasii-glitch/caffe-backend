import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import { createHash, randomBytes } from 'node:crypto'
import { Table, MenuItem } from './models.js'

const TIMES = ['18:00', '19:00', '20:00', '21:00', '22:00']
const LOCK_MS = 5 * 60 * 1000
const fail = (status, message) => { throw Object.assign(new Error(message), { status }) }
const tableId = value => {
  if (!/^[1-9]\d{0,5}$/.test(value)) fail(400, 'شناسه میز نامعتبر است.')
  return Number(value)
}
function publicTable(table) {
  return { id: table.id, title: table.title, capacity: table.capacity, price: table.price,
    isReserved: Boolean(table.reservation), isLocked: !table.reservation && table.lockUntil > new Date() }
}
function publicReservation(table) {
  const { ownerHash, ...reservation } = table.reservation
  return { ...reservation, tableId: table.id, tableTitle: table.title, capacity: table.capacity }
}
function owner(req, _res, next) {
  const token = req.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1]
  if (!token) return next(Object.assign(new Error('شناسه نشست معتبر لازم است.'), { status: 401 }))
  req.ownerHash = createHash('sha256').update(token).digest('hex')
  next()
}

export function createApp({ staticDir } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { message: 'درخواست‌های زیادی ارسال شده است؛ کمی صبر کنید.' } }))
  app.use(express.json({ limit: '16kb' }))
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next() })
  app.get('/api/health', (_req, res) => {
    const ready = mongoose.connection.readyState === 1
    res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable', database: ready ? 'connected' : 'disconnected' })
  })
  // A random browser capability scopes bookings without collecting login credentials.
  // Only its hash is stored in MongoDB. Possession of the secret grants access.
  app.post('/api/session', (_req, res) => res.status(201).json({ token: randomBytes(32).toString('hex') }))
  app.get('/api/menu', async (_req, res) => {
    const items = await MenuItem.find({ available: true }).select('-_id -__v').sort({ id: 1 }).lean()
    res.json({ items, timeOptions: TIMES })
  })
  app.get('/api/tables', async (req, res) => {
    const filter = {}
    if (req.query.capacity !== undefined) {
      if (!['2', '4', '6'].includes(req.query.capacity)) fail(400, 'ظرفیت باید ۲، ۴ یا ۶ باشد.')
      filter.capacity = Number(req.query.capacity)
    }
    res.json({ tables: (await Table.find(filter).sort({ id: 1 }).lean()).map(publicTable) })
  })
  app.post('/api/tables/:id/lock', owner, async (req, res) => {
    const id = tableId(req.params.id)
    const now = new Date()
    // Repeating a request keeps the original expiry, never extends the hold.
    let table = await Table.findOne({ id, reservation: null, lockOwner: req.ownerHash, lockUntil: { $gt: now } }).lean()
    if (!table) table = await Table.findOneAndUpdate({ id, reservation: null,
      $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }] },
    { $set: { lockOwner: req.ownerHash, lockUntil: new Date(now.getTime() + LOCK_MS) } }, { returnDocument: 'after' }).lean()
    if (!table) fail(409, 'این میز رزرو شده یا در حال رزرو توسط شخص دیگری است.')
    res.json({ table: publicTable(table), expiresAt: table.lockUntil })
  })
  app.delete('/api/tables/:id/lock', owner, async (req, res) => {
    await Table.updateOne({ id: tableId(req.params.id), reservation: null, lockOwner: req.ownerHash },
      { $set: { lockOwner: null, lockUntil: null } })
    res.status(204).end()
  })
  app.post('/api/reservations', owner, async (req, res) => {
    const { tableId: id, customerName, bookingTime, addons = [] } = req.body ?? {}
    if (!Number.isSafeInteger(id) || id < 1) fail(400, 'شناسه میز نامعتبر است.')
    if (typeof customerName !== 'string' || customerName.trim().length < 3 || customerName.trim().length > 60) fail(400, 'نام مشتری باید بین ۳ تا ۶۰ حرف باشد.')
    if (!TIMES.includes(bookingTime)) fail(400, 'ساعت حضور نامعتبر است.')
    if (!Array.isArray(addons) || addons.length > 20) fail(400, 'پکیج پذیرایی نامعتبر است.')
    const seen = new Set()
    for (const item of addons) {
      if (!item || !Number.isSafeInteger(item.id) || seen.has(item.id) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) fail(400, 'تعداد یا شناسه اقلام پذیرایی نامعتبر است.')
      seen.add(item.id)
    }
    const table = await Table.findOne({ id }).lean()
    if (!table) fail(404, 'میز پیدا نشد.')
    // Retry after a lost response returns the same booking rather than duplicating it.
    if (table.reservation?.ownerHash === req.ownerHash) return res.json({ reservation: publicReservation(table) })
    const menu = await MenuItem.find({ id: { $in: [...seen] }, isAddon: true, available: true }).lean()
    if (menu.length !== addons.length) fail(400, 'بعضی اقلام پذیرایی در دسترس نیستند.')
    const pricedAddons = addons.map(item => {
      const product = menu.find(p => p.id === item.id)
      return { id: product.id, title: product.title, price: product.price, quantity: item.quantity }
    })
    const reservation = { bookingId: `CAFE-${randomBytes(12).toString('hex').toUpperCase()}`, ownerHash: req.ownerHash,
      customerName: customerName.trim(), bookingTime, addons: pricedAddons, tablePrice: table.price,
      totalPrice: table.price + pricedAddons.reduce((sum, item) => sum + item.price * item.quantity, 0), createdAt: new Date() }
    const updated = await Table.findOneAndUpdate({ id, reservation: null, lockOwner: req.ownerHash, lockUntil: { $gt: new Date() } },
      { $set: { reservation, lockOwner: null, lockUntil: null } }, { returnDocument: 'after', runValidators: true }).lean()
    if (!updated) fail(409, 'زمان رزرو موقت تمام شده یا میز دیگر در دسترس نیست.')
    res.status(201).json({ reservation: publicReservation(updated) })
  })
  app.get('/api/reservations', owner, async (req, res) => {
    const tables = await Table.find({ 'reservation.ownerHash': req.ownerHash }).sort({ 'reservation.createdAt': -1 }).lean()
    res.json({ reservations: tables.map(publicReservation) })
  })
  app.get('/api/reservations/:bookingId', owner, async (req, res) => {
    if (!/^CAFE-[A-F0-9]{24}$/.test(req.params.bookingId)) fail(404, 'رزرو پیدا نشد.')
    const table = await Table.findOne({ 'reservation.bookingId': req.params.bookingId, 'reservation.ownerHash': req.ownerHash }).lean()
    if (!table) fail(404, 'رزرو پیدا نشد.')
    res.json({ reservation: publicReservation(table) })
  })
  app.use('/api', (_req, res) => res.status(404).json({ message: 'مسیر مورد نظر پیدا نشد.' }))
  if (staticDir) {
    app.use(express.static(staticDir))
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: staticDir }))
  }
  app.use((error, _req, res, _next) => {
    const status = error.status || (error.name === 'ValidationError' ? 400 : 500)
    if (status >= 500) console.error(error.name, error.message)
    res.status(status).json({ message: status >= 500 ? 'خطای سرور؛ دوباره تلاش کنید.' : error.message })
  })
  return app
}
