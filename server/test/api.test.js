import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import request from 'supertest'
import { createApp } from '../dist/app.js'
import { seedDatabase } from '../dist/seed.js'
import { Table } from '../dist/models/table.model.js'
import { MenuItem } from '../dist/models/menu-item.model.js'

let mongo
const app = createApp()
let alice, bob
const auth = (cookie) => ({ Cookie: cookie })
const reserve = (token = alice, extra = {}) =>
  request(app)
    .post('/api/reservations')
    .set(auth(token))
    .send({
      tableId: 1,
      customerName: 'مریم احمدی',
      bookingTime: '18:00',
      addons: [{ id: 1, quantity: 2 }],
      ...extra
    })
before(
  async () => {
    process.env.MONGOMS_RESUME_DOWNLOAD ??= 'true'
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.24' }, instance: { args: process.platform === 'win32' ? [] : ['--nounixsocket'] } })
    await mongoose.connect(mongo.getUri())
    await seedDatabase()
    for (const email of ['alice@example.com', 'bob@example.com']) {
      const result = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'کاربر تست',
          username: email.split('@')[0],
          email,
          password: 'Test-password-123'
        })
        .expect(201)
      const cookie = result.headers['set-cookie'][0].split(';')[0]
      if (email.startsWith('alice')) alice = cookie
      else bob = cookie
    }
  },
  { timeout: 1200000 }
)
beforeEach(async () => {
  await Table.updateMany({}, { $set: { reservation: null, lockOwner: null, lockUntil: null } })
})
after(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})

test('health, seeded menu, filtering and authenticated identity', async () => {
  assert.equal((await request(app).get('/api/health')).status, 200)
  assert.equal((await request(app).get('/api/tables')).body.tables.length, 7)
  assert.equal((await request(app).get('/api/tables?capacity=2')).body.tables.length, 2)
  assert.equal((await request(app).get('/api/tables?capacity=evil')).status, 400)
  assert.equal((await request(app).get('/api/menu')).body.items.length, 47)
  assert.equal(
    (await request(app).get('/api/auth/me').set(auth(alice)).expect(200)).body.user.email,
    'alice@example.com'
  )
})
test('two concurrent owners cannot acquire the same table', async () => {
  const results = await Promise.all(
    [alice, bob].map((token) => request(app).post('/api/tables/1/lock').set(auth(token)))
  )
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409])
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
  const result = await reserve(alice, {
    totalPrice: 1,
    addons: [{ id: 1, quantity: 2, price: 1 }]
  }).expect(201)
  const booking = result.body.reservation
  assert.equal(booking.totalPrice, 400000)
  assert.equal(booking.ownerHash, undefined)
  assert.equal((await reserve().expect(200)).body.reservation.bookingId, booking.bookingId)
  await seedDatabase()
  assert.equal(
    (await request(app).get(`/api/reservations/${booking.bookingId}`).set(auth(alice))).body
      .reservation.totalPrice,
    400000
  )
  await request(app).get(`/api/reservations/${booking.bookingId}`).set(auth(bob)).expect(404)
  assert.equal(
    (await request(app).get('/api/reservations').set(auth(bob))).body.reservations.length,
    0
  )
  assert.equal(
    (await request(app).get('/api/reservations').set(auth(alice))).body.reservations.length,
    1
  )
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
  assert.equal(results.filter((result) => result.status === 201).length, 1)
  assert.ok(results.every((result) => [200, 201, 409].includes(result.status)))
  const stored = await Table.find({ 'reservation.ownerHash': { $ne: null } }).lean()
  assert.equal(stored.filter((table) => table.reservation).length, 1)
})
test('input validation blocks invalid quantities, duplicate addons and bad customer data', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice))
  for (const extra of [
    { customerName: 'a' },
    { customerName: { $ne: '' } },
    { bookingTime: '03:00' },
    { addons: [{ id: 1, quantity: -1 }] },
    { addons: [{ id: 1, quantity: 1.5 }] },
    { addons: [{ id: 1, quantity: 21 }] },
    { addons: [{ id: 999, quantity: 1 }] },
    {
      addons: [
        { id: 1, quantity: 1 },
        { id: 1, quantity: 1 }
      ]
    },
    { tableId: { $ne: null } }
  ])
    await reserve(alice, extra).expect(400)
  await MenuItem.updateOne({ id: 1 }, { $set: { available: false } })
  await reserve().expect(400)
  await MenuItem.updateOne({ id: 1 }, { $set: { available: true } })
})

test('registration validation, normalization, duplicate email and safe user DTO', async () => {
  for (const input of [
    null,
    {},
    { name: 'x', email: 'bad', password: '123' },
    { name: 'مریم احمدی', email: { $ne: '' }, password: 'long-password' }
  ]) {
    await request(app).post('/api/auth/register').send(input).expect(400)
  }
  const registered = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'مریم احمدی',
      username: '  MARYAM_USER ',
      email: '  MARYAM@EXAMPLE.COM ',
      password: 'Test-password-123'
    })
    .expect(201)
  assert.deepEqual(Object.keys(registered.body.user).sort(), ['email', 'id', 'name', 'username'])
  assert.equal(registered.body.user.email, 'maryam@example.com')
  assert.equal(registered.body.user.username, 'maryam_user')
  assert.match(registered.headers['set-cookie'][0], /HttpOnly/)
  assert.match(registered.headers['set-cookie'][0], /SameSite=Strict/)
  await request(app)
    .post('/api/auth/register')
    .send({
      name: 'کاربر دوم',
      username: 'other_user',
      email: 'maryam@example.com',
      password: 'Test-password-123'
    })
    .expect(409)
})

test('password checking, session rotation, logout revocation and expiry', async () => {
  const input = { email: 'alice@example.com', password: 'Test-password-123' }
  await request(app)
    .post('/api/auth/login')
    .send({ ...input, password: 'wrong-password' })
    .expect(401)
  await request(app)
    .post('/api/auth/login')
    .send({ ...input, email: 'nobody@example.com' })
    .expect(401)
  const first = await request(app).post('/api/auth/login').send(input).expect(200)
  const firstCookie = first.headers['set-cookie'][0].split(';')[0]
  const second = await request(app)
    .post('/api/auth/login')
    .set('Cookie', firstCookie)
    .send(input)
    .expect(200)
  const secondCookie = second.headers['set-cookie'][0].split(';')[0]
  assert.notEqual(firstCookie, secondCookie)
  await request(app).get('/api/auth/me').set('Cookie', firstCookie).expect(401)
  await request(app).get('/api/auth/me').set('Cookie', secondCookie).expect(200)
  await request(app).post('/api/auth/logout').set('Cookie', secondCookie).expect(204)
  await request(app).get('/api/auth/me').set('Cookie', secondCookie).expect(401)
  const { Session } = await import('../dist/models/session.model.js')
  const { hashToken } = await import('../dist/routes/auth.routes.js')
  await Session.updateOne(
    { tokenHash: hashToken(firstCookie.split('=')[1]) },
    { $set: { expiresAt: new Date(0) } }
  )
  const expired = await request(app).post('/api/auth/login').send(input).expect(200)
  const expiredCookie = expired.headers['set-cookie'][0].split(';')[0]
  await Session.updateOne(
    { tokenHash: hashToken(expiredCookie.split('=')[1]) },
    { $set: { expiresAt: new Date(0) } }
  )
  await request(app).get('/api/auth/me').set('Cookie', expiredCookie).expect(401)
})

test('reservations survive logout and login with the same account', async () => {
  await request(app).post('/api/tables/1/lock').set(auth(alice)).expect(200)
  const booked = (await reserve().expect(201)).body.reservation
  const result = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@example.com', password: 'Test-password-123' })
    .expect(200)
  const cookie = result.headers['set-cookie'][0].split(';')[0]
  const bookings = await request(app).get('/api/reservations').set('Cookie', cookie).expect(200)
  assert.equal(bookings.body.reservations[0].bookingId, booked.bookingId)
  const { User } = await import('../dist/models/user.model.js')
  const user = await User.findOne({ email: 'alice@example.com' }).select('+passwordHash').lean()
  assert.notEqual(user.passwordHash, 'Test-password-123')
  assert.match(user.passwordHash, /^[a-f0-9]{32}:[a-f0-9]{128}$/)
})

test('usernames are required, normalized, unique and support signing in', async () => {
  const usernameApp = createApp()
  const account = {
    email: 'username@example.com',
    username: ' New_User ',
    password: 'Test-password-123'
  }
  for (const username of [
    undefined,
    null,
    '',
    'ab',
    'has space',
    '@alice',
    'a'.repeat(31),
    { $ne: '' }
  ]) {
    await request(usernameApp)
      .post('/api/auth/register')
      .send({ ...account, username })
      .expect(400)
  }
  const registered = await request(usernameApp).post('/api/auth/register').send(account).expect(201)
  assert.equal(registered.body.user.username, 'new_user')
  assert.equal(registered.body.user.name, 'new_user')
  const duplicate = await request(usernameApp)
    .post('/api/auth/register')
    .send({ ...account, email: 'another@example.com', username: 'NEW_USER' })
    .expect(409)
  assert.match(duplicate.body.message, /نام کاربری/)
  const signedIn = await request(usernameApp)
    .post('/api/auth/login')
    .send({ identifier: 'NEW_USER', password: account.password })
    .expect(200)
  assert.equal(signedIn.body.user.id, registered.body.user.id)
  await request(usernameApp)
    .post('/api/auth/login')
    .send({ identifier: 'new_user', password: 'Wrong-password' })
    .expect(401)
  await request(usernameApp)
    .post('/api/auth/login')
    .send({ identifier: account.email, password: account.password })
    .expect(200)
  const { User } = await import('../dist/models/user.model.js')
  await assert.rejects(
    User.create({
      name: 'کاربر تکراری',
      username: 'new_user',
      email: 'race@example.com',
      passwordHash: 'test'
    }),
    (error) => error.code === 11000
  )
})

test('Persian usernames work and existing email-only accounts remain usable', async () => {
  const usernameApp = createApp()
  const password = 'Test-password-123'
  await request(usernameApp)
    .post('/api/auth/register')
    .send({ name: 'کاربر فارسی', username: 'مریم_۱۲۳', email: 'persian@example.com', password })
    .expect(201)
  await request(usernameApp)
    .post('/api/auth/login')
    .send({ identifier: 'مریم_۱۲۳', password })
    .expect(200)
  const { User } = await import('../dist/models/user.model.js')
  const { hashPassword } = await import('../dist/utils/password.js')
  await User.collection.insertOne({
    name: 'حساب قدیمی',
    email: 'legacy@example.com',
    passwordHash: await hashPassword(password)
  })
  const legacy = await request(usernameApp)
    .post('/api/auth/login')
    .send({ identifier: 'legacy@example.com', password })
    .expect(200)
  assert.equal(legacy.body.user.username, null)
})
