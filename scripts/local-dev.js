import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { startDevelopment } from './dev.js'

const requireServer = createRequire(new URL('../server/package.json', import.meta.url))
const databasePath = fileURLToPath(new URL('../server/.local-db/', import.meta.url))
let mongo
try {
  if (Number(process.versions.node.split('.')[0]) < 22)
    throw new Error('Install Node.js 22 or newer first.')
  if (
    !existsSync(
      new URL('../server/node_modules/mongodb-memory-server-core/package.json', import.meta.url)
    ) ||
    !existsSync(
      new URL('../cafe-aramesh-final-task/node_modules/vite/package.json', import.meta.url)
    )
  ) {
    throw new Error('Dependencies are missing. Run: npm.cmd run setup')
  }
  const { MongoMemoryServer } = requireServer('mongodb-memory-server-core')
  process.env.MONGOMS_RESUME_DOWNLOAD ??= 'true'
  await mkdir(databasePath, { recursive: true })
  console.log('Starting local MongoDB. First run may download about 600 MB; please wait.')
  mongo = await MongoMemoryServer.create({
    binary: { version: '7.0.24' },
    instance: {
      dbPath: databasePath,
      storageEngine: 'wiredTiger',
      ip: '127.0.0.1',
      args: process.platform === 'win32' ? [] : ['--nounixsocket']
    }
  })
  console.log(`MongoDB ready. Persistent data: ${databasePath}`)
  startDevelopment({
    watchBackend: false,
    env: { ...process.env, NODE_ENV: 'development', MONGODB_URI: mongo.getUri('cafe_aramesh') },
    onStop: () => mongo.stop({ doCleanup: false })
  })
} catch (error) {
  console.error(error.message)
  if (mongo) await mongo.stop({ doCleanup: false })
  process.exitCode = 1
}
