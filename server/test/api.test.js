import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { Table, MenuItem, seedDatabase } from '../src/models.js'

let mongo
const app = createApp()
const alice = 'a'.repeat(64)
const bob = 'b'.repeat(64)
const auth = token => ({ Authorization: `Bearer ${token}` })
const reserve = (token = alice, extra = {}) => request(app).post('/api/reservations').set(auth(token)).send({
  tableId: 1, customerName: 'مریم احمدی', bookingTime: '18:00', addons: [{ id: 1, quantity: 2 }], ...extra
})
before(async () => {
  process.env.MONGOMS_RESUME_DOWNLOAD ??= 'true'
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  await seedDatabase()
}, { timeout: 1200000 })
beforeEach(async () => {
  await Table.updateMany({}, { $set: { reservation: null, lockOwner: null, lockUntil: null } })
})
after(async () => { await mongoose.disconnect(); await mongo?.stop() })

test('health, seeded menu, filtering and session creation', async () => {
  assert.equal((await request(app).get('/api/health')).status, 200)
  assert.equal((await request(app).get('/api/tables')).body.tables.length, 6)
  assert.equal((await request(app).get('/api/tables?capacity=2')).body.tables.length, 2)
  assert.equal((await request(app).get('/api/tables?capacity=evil')).status, 400)
  assert.equal((await request(app).get('/api/menu')).body.items.length, 9)
  assert.match((await request(app).post('/api/session')).body.token, /^[a-f0-9]{64}$/)
})
test('two concurrent owners cannot acquire the same table', async () => {
  const results = await Promise.all([alice, bob].map(token => request(app).post('/api/tables/1/lock').set(auth(token))))
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409])
})
test('only owner can release hold; repeated lock does not extend expiry', async () => {
  const first = await request(app).post('/api/tables/1/lock').set(auth(alice))
  const second = await request(app).post('/api/tables/1/lock').set(auth(alice))
  assert.equal(first.body.expiresAt, second.body.expiresAt)
  await request(app).delete('/api/tables/1/lock').set(auth(bob)).expect(204)
  await request(app).post('/api/tables/1/lock').set(auth(bob)).expect(409)
  await request(app).delete('/api/tables/1/lock').set(auth(alice)).expect(204)
  await request(app).post('/api/tables/1/lock').set(auth(bob)).expect(200)
})
test('expired locks are rejected and reclaimable without a cleanup job', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice))
  await Table.updateOne({ id: 1 }, { $set: { lockUntil: new Date(Date.now() - 1000) } })
  await reserve().expect(409)
  assert.equal((await request(app).get('/api/tables')).body.tables[0].isLocked, false)
  await request(app).post('/api/tables/1/lock').set(auth(bob)).expect(200)
})
test('server prices, persistence, receipt ownership and idempotent retry', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice)).expect(200)
  const result = await reserve(alice, { totalPrice: 1, addons: [{ id: 1, quantity: 2, price: 1 }] }).expect(201)
  const booking = result.body.reservation
  assert.equal(booking.totalPrice, 260000)
  assert.equal(booking.ownerHash, undefined)
  assert.equal((await reserve().expect(200)).body.reservation.bookingId, booking.bookingId)
  await seedDatabase()
  assert.equal((await request(app).get(`/api/reservations/${booking.bookingId}`).set(auth(alice))).body.reservation.totalPrice, 260000)
  await request(app).get(`/api/reservations/${booking.bookingId}`).set(auth(bob)).expect(404)
  assert.equal((await request(app).get('/api/reservations').set(auth(bob))).body.reservations.length, 0)
  assert.equal((await request(app).get('/api/reservations').set(auth(alice))).body.reservations.length, 1)
  const publicTables = (await request(app).get('/api/tables')).body.tables
  assert.equal(publicTables[0].isReserved, true)
  assert.equal(JSON.stringify(publicTables).includes('مریم'), false)
  await request(app).post('/api/tables/1/lock').set(auth(bob)).expect(409)
})
test('a foreign owner cannot finalize someone else’s hold', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice))
  await reserve(bob).expect(409)
  await reserve(alice).expect(201)
})
test('concurrent confirmations commit only one reservation', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice)).expect(200)
  const results = await Promise.all([reserve(), reserve()])
  assert.equal(results.filter(result => result.status === 201).length, 1)
  assert.ok(results.every(result => [200, 201, 409].includes(result.status)))
  const stored = await Table.find({ 'reservation.ownerHash': { $ne: null } }).lean()
  assert.equal(stored.filter(table => table.reservation).length, 1)
})
test('input validation blocks invalid quantities, duplicate addons and bad customer data', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice))
  for (const extra of [
    { customerName: 'a' }, { customerName: { $ne: '' } }, { bookingTime: '03:00' },
    { addons: [{ id: 1, quantity: -1 }] }, { addons: [{ id: 1, quantity: 1.5 }] },
    { addons: [{ id: 1, quantity: 21 }] }, { addons: [{ id: 999, quantity: 1 }] },
    { addons: [{ id: 1, quantity: 1 }, { id: 1, quantity: 1 }] }, { tableId: { $ne: null } }
  ]) await reserve(alice, extra).expect(400)
  await MenuItem.updateOne({ id: 1 }, { $set: { available: false } })
  await reserve().expect(400)
  await MenuItem.updateOne({ id: 1 }, { $set: { available: true } })
})
