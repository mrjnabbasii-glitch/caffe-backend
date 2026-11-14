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
let mongo, app
const account = {
  username: 'typed_user',
  email: 'typed@example.com',
  password: 'Secret-password-123'
}
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
  app = createApp()
})
after(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})

test('typed auth DTOs trim identifiers, preserve password spaces and ignore privileged extra fields', async () => {
  const password = '  Secret-password-123  '
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({
      username: '  TYPED_USER  ',
      email: '  TYPED@EXAMPLE.COM  ',
      password,
      passwordVersion: 999,
      isAdmin: true
    })
    .expect(201)
  assert.equal(signup.body.user.username, 'typed_user')
  assert.equal(signup.body.user.email, 'typed@example.com')
  await request(app)
    .post('/api/auth/login')
    .send({ identifier: '  TYPED_USER  ', password })
    .expect(200)
  await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'typed_user', password: password.trim() })
    .expect(401)
  const stored = await User.findOne({ username: 'typed_user' }).lean()
  assert.equal(stored.passwordVersion, 0)
  assert.equal(stored.isAdmin, undefined)
})

test('class-validator rejects incorrect primitive types instead of coercing JSON input', async () => {
  for (const extra of [
    { username: 123 },
    { email: 123 },
    { password: 123456789 },
    { username: { $ne: '' } },
    { email: ['typed@example.com'] }
  ])
    await request(app)
      .post('/api/auth/signup')
      .send({ ...account, ...extra })
      .expect(400)
  for (const input of [[], [account], 'invalid'])
    await request(app).post('/api/auth/signup').send(input).expect(400)
})

test('nested reservation DTOs validate item types and trim valid customer and time fields', async () => {
  const signup = await request(app).post('/api/auth/signup').send(account).expect(201)
  const cookie = signup.headers['set-cookie'][0].split(';')[0]
  const filter = await request(app).get('/api/tables').query({ capacity: ' 2 ' }).expect(200)
  assert.equal(filter.body.tables.length, 2)
  await request(app).post('/api/tables/1/lock').set('Cookie', cookie).expect(200)
  const booking = {
    tableId: 1,
    customerName: '  مشتری نمونه  ',
    bookingTime: ' 18:00 ',
    addons: [{ id: 1, quantity: 1 }]
  }
  for (const extra of [
    { tableId: '1' },
    { customerName: 123 },
    { addons: [{ id: 1, quantity: '2' }] },
    { addons: [{ id: '1', quantity: 1 }] },
    { addons: [null] },
    {
      addons: [
        { id: 1, quantity: 1 },
        { id: 1, quantity: 1 }
      ]
    }
  ])
    await request(app)
      .post('/api/reservations')
      .set('Cookie', cookie)
      .send({ ...booking, ...extra })
      .expect(400)
  const result = await request(app)
    .post('/api/reservations')
    .set('Cookie', cookie)
    .send({ ...booking, totalPrice: 1, addons: [{ id: 1, quantity: 1, price: 1 }] })
    .expect(201)
  assert.equal(result.body.reservation.customerName, 'مشتری نمونه')
  assert.equal(result.body.reservation.bookingTime, '18:00')
  assert.equal(result.body.reservation.totalPrice, 250000)
})
