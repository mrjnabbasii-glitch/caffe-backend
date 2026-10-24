import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

const root = fileURLToPath(new URL('../', import.meta.url))
const child = spawn(process.execPath, ['scripts/local-dev.js'], {
  cwd: root, env: { ...process.env, PORT: '3000', NO_COLOR: '1', FORCE_COLOR: '0' },
  stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true
})
let output = ''
let exited = false
child.stdout.on('data', chunk => { output += chunk })
child.stderr.on('data', chunk => { output += chunk })
const completion = new Promise(resolve => child.once('exit', code => { exited = true; resolve(code) }))
try {
  const deadline = Date.now() + 60000
  while ((!output.includes('Cafe API:') || !/Local:\s+http:\/\/localhost:\d+/.test(output)) && !exited && Date.now() < deadline) await delay(200)
  assert.ok(!exited && output.includes('Cafe API:'), output)
  const port = output.match(/Local:\s+http:\/\/localhost:(\d+)/)?.[1]
  assert.ok(port, output)
  const origin = `http://localhost:${port}`
  const health = await fetch(`${origin}/api/health`).then(response => response.json())
  assert.equal(health.status, 'ok')
  const menu = await fetch(`${origin}/api/menu`).then(response => response.json())
  const tables = await fetch(`${origin}/api/tables`).then(response => response.json())
  assert.equal(menu.items.length, 9)
  assert.equal(tables.tables.length, 6)
  console.log('Local MongoDB, API and Vite proxy work together.')
  child.send('stop')
  const exitCode = await Promise.race([completion, delay(20000, 'timeout', { ref: false })])
  assert.equal(exitCode, 0, output)
  await assert.rejects(fetch('http://127.0.0.1:3000/api/health', { signal: AbortSignal.timeout(2000) }))
  console.log('Shutdown closes the backend; database files are retained.')
} catch (error) {
  console.error(output)
  throw error
} finally {
  if (!exited && child.connected) {
    child.send('stop')
    await Promise.race([completion, delay(10000, undefined, { ref: false })])
  }
}
