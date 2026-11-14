import { before, beforeEach, after, test } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import request from 'supertest'
import { createApp } from '../dist/app.js'
import { seedDatabase } from '../dist/seed.js'
import { User } from '../dist/models/user.model.js'
import { Session } from '../dist/models/session.model.js'
import { hashPassword } from '../dist/utils/password.js'
import { hashToken, createSession } from '../dist/routes/auth.routes.js'

let mongo
let sent
const originalPassword = 'Original-password-123'
const newPassword = 'New-password-456'
const account = { username: 'reset_user', email: 'reset@example.com' }
const appFor = (
  sendResetEmail = async (mail) => {
    sent.push(mail)
  }
) => createApp({ sendResetEmail })
const cookie = (response) => response.headers['set-cookie'][0].split(';')[0]
const tokenFrom = (mail) => new URLSearchParams(new URL(mail.url).hash.slice(1)).get('token')
const login = (app, password = originalPassword) =>
  request(app).post('/api/auth/login').send({ identifier: account.username, password })
const forgot = (app) =>
  request(app).post('/api/auth/forgot-password').send({ email: account.email })
const reset = (app, token, password = newPassword) =>
  request(app).post('/api/auth/reset-password').send({ token, password })

before(
  async () => {
    mongo = await MongoMemoryServer.create({ binary: { version: '7.0.24' }, instance: { args: process.platform === 'win32' ? [] : ['--nounixsocket'] } })
    await mongoose.connect(mongo.getUri())
    await seedDatabase()
  },
  { timeout: 1200000 }
)
beforeEach(async () => {
  sent = []
  await Promise.all([User.deleteMany({}), Session.deleteMany({})])
  await User.create({
    ...account,
    name: account.username,
    passwordHash: await hashPassword(originalPassword)
  })
})
after(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})

test('signup alias creates an account and login accepts its username', async () => {
  const app = appFor()
  const signup = await request(app)
    .post('/api/auth/signup')
    .send({ username: 'new_signup', email: 'signup@example.com', password: originalPassword })
    .expect(201)
  assert.equal(signup.body.user.username, 'new_signup')
  await request(app).get('/api/auth/me').set('Cookie', cookie(signup)).expect(200)
  await request(app)
    .post('/api/auth/login')
    .send({ identifier: 'new_signup', password: originalPassword })
    .expect(200)
})

test('forgot-password validates email, hides account existence and stores only a token hash', async () => {
  const app = appFor()
  for (const email of [null, '', 'bad', { $ne: '' }])
    await request(app).post('/api/auth/forgot-password').send({ email }).expect(400)
  const missing = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'missing@example.com' })
    .expect(202)
  const known = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: ' RESET@EXAMPLE.COM ' })
    .expect(202)
  assert.deepEqual(known.body, missing.body)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].to, account.email)
  const token = tokenFrom(sent[0])
  assert.match(token, /^[a-f0-9]{64}$/)
  assert.equal(new URL(sent[0].url).search, '')
  assert.ok(!JSON.stringify(known.body).includes(token))
  const user = await User.findOne({ email: account.email })
    .select('+resetTokenHash +resetExpiresAt')
    .lean()
  assert.equal(user.resetTokenHash, hashToken(token))
  assert.notEqual(user.resetTokenHash, token)
  assert.ok(user.resetExpiresAt > new Date())
  await forgot(app).expect(202)
  assert.equal(sent.length, 1)
  const me = await login(app).expect(200)
  assert.equal(me.body.user.resetTokenHash, undefined)
})

test('reset changes the password once and revokes every old session including in-flight logins', async () => {
  const app = appFor()
  const first = cookie(await login(app).expect(200))
  const second = cookie(await login(app).expect(200))
  await forgot(app).expect(202)
  const token = tokenFrom(sent[0])
  await reset(app, token).expect(200)
  await request(app).get('/api/auth/me').set('Cookie', first).expect(401)
  await request(app).get('/api/auth/me').set('Cookie', second).expect(401)
  await login(app).expect(401)
  await login(app, newPassword).expect(200)
  await reset(app, token).expect(400)
  const user = await User.findOne({ email: account.email }).select('+resetTokenHash').lean()
  assert.equal(user.resetTokenHash, undefined)
  assert.equal(user.passwordVersion, 1)
  const staleToken = await createSession(user._id, undefined, 0)
  await request(app)
    .get('/api/auth/me')
    .set('Cookie', 'cafe_session=' + staleToken)
    .expect(401)
})

test('invalid or expired links fail and invalid passwords do not consume a valid token', async () => {
  const app = appFor()
  await reset(app, 'bad').expect(400)
  await reset(app, 'a'.repeat(64)).expect(400)
  await forgot(app).expect(202)
  const token = tokenFrom(sent[0])
  await reset(app, token, 'tiny').expect(400)
  await reset(app, token).expect(200)
  await User.updateOne({ email: account.email }, { $unset: { resetRequestedAt: 1 } })
  await forgot(app).expect(202)
  const expired = tokenFrom(sent[1])
  await User.updateOne({ email: account.email }, { $set: { resetExpiresAt: new Date(0) } })
  await reset(app, expired).expect(400)
})

test('a newer recovery link replaces the old one and concurrent token replays commit once', async () => {
  const app = appFor()
  await forgot(app).expect(202)
  const oldToken = tokenFrom(sent[0])
  await User.updateOne(
    { email: account.email },
    { $set: { resetRequestedAt: new Date(Date.now() - 61000) } }
  )
  await forgot(app).expect(202)
  const token = tokenFrom(sent[1])
  await reset(app, oldToken).expect(400)
  const responses = await Promise.all([reset(app, token), reset(app, token)])
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400])
})

test('delivery failure invalidates the token without disclosing account existence', async () => {
  const app = appFor(async () => {
    throw Object.assign(new Error('Test delivery failure'), { code: 'TEST_DELIVERY' })
  })
  const known = await forgot(app).expect(202)
  const missing = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'missing@example.com' })
    .expect(202)
  assert.deepEqual(known.body, missing.body)
  const user = await User.findOne({ email: account.email })
    .select('+resetTokenHash +resetRequestedAt')
    .lean()
  assert.equal(user.resetTokenHash, undefined)
  assert.equal(user.resetRequestedAt, undefined)
})

test('recovery requests are rate limited independently of login', async () => {
  const app = appFor()
  for (let index = 0; index < 10; index++)
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' })
      .expect(202)
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'missing@example.com' })
    .expect(429)
  await login(app).expect(200)
})

test('production without SMTP fails closed with the same result for all emails', async () => {
  const keys = ['NODE_ENV', 'APP_ORIGIN', 'MAIL_MODE', 'SMTP_HOST', 'MAIL_FROM']
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  try {
    process.env.NODE_ENV = 'production'
    process.env.APP_ORIGIN = 'https://cafe.example'
    process.env.MAIL_MODE = 'smtp'
    delete process.env.SMTP_HOST
    delete process.env.MAIL_FROM
    const app = createApp()
    const known = await forgot(app).expect(503)
    const missing = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'missing@example.com' })
      .expect(503)
    assert.deepEqual(known.body, missing.body)
    const user = await User.findOne({ email: account.email }).select('+resetTokenHash').lean()
    assert.equal(user.resetTokenHash, undefined)
  } finally {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
  }
})
