import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const frontend = fileURLToPath(new URL('../cafe-aramesh-final-task/', import.meta.url))
const backend = fileURLToPath(new URL('../server/', import.meta.url))
async function stopChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
  if (process.platform === 'win32') {
    // Node's watcher spawns its own server process; stop that descendant too.
    await new Promise(resolveStop => {
      const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' })
      killer.once('error', () => { child.kill(); resolveStop() })
      killer.once('exit', resolveStop)
    })
  } else {
    child.kill('SIGTERM')
    await new Promise(resolveStop => {
      const timeout = setTimeout(() => { child.kill('SIGKILL'); resolveStop() }, 3000)
      child.once('exit', () => { clearTimeout(timeout); resolveStop() })
    })
  }
}

export function startDevelopment({ env = process.env, onStop = async () => {} } = {}) {
  const options = { env, stdio: 'inherit', windowsHide: true }
  const children = [
    spawn(process.execPath, ['--watch', '--env-file-if-exists=.env', 'src/index.js'], { ...options, cwd: backend }),
    spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { ...options, cwd: frontend })
  ]
  let stopping
  function stop(code = 0) {
    if (stopping) return stopping
    process.exitCode = code
    stopping = (async () => {
      await Promise.all(children.map(stopChild))
      await onStop()
    })().catch(error => { console.error(error.message); process.exitCode = 1 })
      .finally(() => {
        process.removeListener('SIGINT', onSignal)
        process.removeListener('SIGTERM', onSignal)
        process.removeListener('message', onMessage)
      })
    return stopping
  }
  const onSignal = () => { void stop() }
  const onMessage = message => { if (message === 'stop') void stop() }
  for (const child of children) {
    child.on('error', error => { console.error(error.message); void stop(1) })
    child.on('exit', code => { void stop(code || 0) })
  }
  process.once('SIGINT', onSignal)
  process.once('SIGTERM', onSignal)
  process.on('message', onMessage)
  return { stop, children }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) startDevelopment()
