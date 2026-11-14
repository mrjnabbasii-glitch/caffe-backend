import { spawn } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const backend = fileURLToPath(new URL('../server/', import.meta.url))
const compiled = join(backend, 'dist')
let server
let stopping = false
let restarting = false
function signature(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const file = join(directory, entry.name)
      if (entry.isDirectory()) return signature(file)
      if (!entry.name.endsWith('.js')) return []
      const stat = statSync(file)
      return [file + ':' + stat.mtimeMs + ':' + stat.size]
    })
    .join('|')
}
function start() {
  server = spawn(process.execPath, ['--env-file-if-exists=.env', 'dist/index.js'], {
    cwd: backend,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true
  })
  server.on('error', (error) => console.error(error.message))
  server.on('exit', (code) => {
    if (!stopping && !restarting && code)
      console.error('API stopped; waiting for a corrected build.')
  })
}
async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return
  const current = server
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      current.kill('SIGKILL')
      resolve()
    }, 3000)
    current.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
    current.kill('SIGTERM')
  })
}
let previous = signature(compiled)
let pending = false
start()
// Poll only compiled JavaScript. MongoDB and mail files never participate.
const interval = setInterval(async () => {
  if (stopping || restarting) return
  let latest
  try {
    latest = signature(compiled)
  } catch {
    return
  }
  if (latest !== previous) {
    previous = latest
    pending = true
    return
  }
  if (!pending) return
  pending = false
  restarting = true
  console.log('Compiled API changed; restarting once after compilation settles.')
  await stopServer()
  if (!stopping) start()
  restarting = false
}, 500)
async function stop() {
  if (stopping) return
  stopping = true
  clearInterval(interval)
  await stopServer()
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
