import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../src/app.js'

const app = createApp()
test('health reports unavailable database instead of a false success', async () => {
  const result = await request(app).get('/api/health').expect(503)
  assert.equal(result.body.database, 'disconnected')
  assert.equal(result.headers['cache-control'], 'no-store')
})
test('session is an unpredictable 256-bit capability', async () => {
  const first = (await request(app).post('/api/session').expect(201)).body.token
  const second = (await request(app).post('/api/session').expect(201)).body.token
  assert.match(first, /^[a-f0-9]{64}$/)
  assert.notEqual(first, second)
})
test('authentication, malformed JSON and unknown endpoints fail without database access', async () => {
  await request(app).get('/api/reservations').expect(401)
  await request(app).post('/api/tables/1/lock').set('Authorization', 'Bearer bad').expect(401)
  await request(app).post('/api/reservations').set('Content-Type', 'application/json').send('{bad').expect(400)
  await request(app).get('/api/unknown').expect(404)
})
