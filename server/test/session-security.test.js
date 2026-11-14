import { before, beforeEach, after, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import request from 'supertest'
import { createApp } from '../dist/app.js'
import { seedDatabase } from '../dist/seed.js'
import { User } from '../dist/models/user.model.js'
import { Session } from '../dist/models/session.model.js'
import { Table } from '../dist/models/table.model.js'
import { SESSION_MS, hashToken } from '../dist/routes/auth.routes.js'
import { hashPassword, verifyPassword } from '../dist/utils/password.js'
let mongo
const account = {
  username: 'session_member',
  email: 'session@example.com',
  password: 'Session-password-123'
}
const signup = (app) => request(app).post('/api/auth/signup').send(account)
const cookie = (result) => result.headers['set-cookie'][0].split(';')[0]
before(
  async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.24' }, instance: { args: process.platform === 'win32' ? [] : ['--nounixsocket'] } })
    await mongoose.connect(mongo.getUri())
    await seedDatabase()
  },
  { timeout: 1200000 }
)
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    Table.updateMany({}, { $set: { reservation: null, lockOwner: null, lockUntil: null } })
  ])
})
after(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})

test('signup and login create persistent seven-day cookies and matching database expirations', async () => {
  const app = createApp()
  const started = Date.now()
  const registered = await signup(app).expect(201)
  const signedIn = await request(app)
    .post('/api/auth/login')
    .send({ identifier: account.username, password: account.password })
    .expect(200)
  assert.equal(SESSION_MS, 604800000)
  for (const result of [registered, signedIn]) {
    const header = result.headers['set-cookie'][0]
    assert.match(header, /Max-Age=604800(?:;|$)/)
    assert.match(header, /Expires=/)
    assert.match(header, /HttpOnly/)
    const token = cookie(result).split('=')[1]
    const session = await Session.findOne({ tokenHash: hashToken(token) }).lean()
    assert.ok(session.expiresAt.getTime() >= started + SESSION_MS)
    assert.ok(session.expiresAt.getTime() <= Date.now() + SESSION_MS)
    const expires = Date.parse(header.match(/Expires=([^;]+)/)[1])
    assert.ok(Math.abs(expires - session.expiresAt.getTime()) < 1100)
    assert.equal(result.body.token, undefined)
    assert.equal(result.body.user.passwordHash, undefined)
  }
})

test('a six-day-old session and its booking survive a fresh app and database reconnect', async () => {
  const app = createApp()
  const oldCookie = cookie(await signup(app).expect(201))
  await request(app).post('/api/tables/1/lock').set('Cookie', oldCookie).expect(200)
  const saved = await request(app)
    .post('/api/reservations')
    .set('Cookie', oldCookie)
    .send({ tableId: 1, customerName: account.username, bookingTime: '18:00', addons: [] })
    .expect(201)
  await Session.collection.updateMany(
    {},
    {
      $set: {
        createdAt: new Date(Date.now() - 6 * 86400000),
        expiresAt: new Date(Date.now() + 86400000)
      }
    }
  )
  const agedSession = await Session.findOne().lean()
  assert.ok(Date.now() - agedSession.createdAt.getTime() >= 6 * 86400000)
  await mongoose.disconnect()
  await mongoose.connect(mongo.getUri())
  const reopened = createApp()
  await request(reopened).get('/api/auth/me').set('Cookie', oldCookie).expect(200)
  const receipt = await request(reopened)
    .get('/api/reservations/' + saved.body.reservation.bookingId)
    .set('Cookie', oldCookie)
    .expect(200)
  assert.equal(receipt.body.reservation.customerName, account.username)
  assert.equal(
    (await request(reopened).get('/api/reservations').set('Cookie', oldCookie).expect(200)).body
      .reservations.length,
    1
  )
})

test('a session past its seven-day expiration fails even before the TTL cleanup runs', async () => {
  const app = createApp()
  const oldCookie = cookie(await signup(app).expect(201))
  await Session.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1) } })
  const response = await request(app).get('/api/reservations').set('Cookie', oldCookie).expect(401)
  assert.match(response.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/)
})

test('passwords use independent random salts and invalid stored hashes fail safely', async () => {
  const first = await hashPassword(account.password)
  const second = await hashPassword(account.password)
  assert.notEqual(first, account.password)
  assert.notEqual(first, second)
  assert.match(first, /^[a-f0-9]{32}:[a-f0-9]{128}$/)
  assert.equal(await verifyPassword(account.password, first), true)
  assert.equal(await verifyPassword('Wrong-password', first), false)
  for (const malformed of [undefined, null, '', 'invalid', ':', 'a:b'])
    assert.equal(await verifyPassword(account.password, malformed), false)
  const app = createApp()
  await signup(app).expect(201)
  const stored = await User.findOne({ email: account.email }).select('+passwordHash').lean()
  assert.notEqual(stored.passwordHash, account.password)
  assert.equal(await verifyPassword(account.password, stored.passwordHash), true)
})
