import { test } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../dist/app.js'

const app = createApp()
test('health reports unavailable database instead of a false success', async () => {
  const result = await request(app).get('/api/health').expect(503)
  assert.equal(result.body.database, 'disconnected')
  assert.equal(result.headers['cache-control'], 'no-store')
})
test('anonymous capabilities are removed and foreign origins rejected', async () => {
  await request(app).post('/api/session').expect(404)
  await request(app)
    .post('/api/auth/login')
    .set('Origin', 'https://foreign.example')
    .send({})
    .expect(403)
  await request(app).post('/api/auth/logout').set('Sec-Fetch-Site', 'cross-site').expect(403)
  await request(app).post('/api/auth/logout').set('Origin', 'http://localhost:5173').expect(204)
})

test('authentication, malformed JSON and unknown endpoints fail without database access', async () => {
  await request(app).get('/api/reservations').expect(401)
  await request(app).post('/api/tables/1/lock').set('Authorization', 'Bearer bad').expect(401)
  await request(app)
    .post('/api/reservations')
    .set('Content-Type', 'application/json')
    .send('{bad')
    .expect(400)
  await request(app).get('/api/unknown').expect(404)
})
