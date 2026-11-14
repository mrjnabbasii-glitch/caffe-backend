import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { seedDatabase } from './seed.js'

const port = Number(process.env.PORT || 3000)
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafe_aramesh'
const isProduction = process.env.NODE_ENV === 'production'

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
  await seedDatabase()

  const staticDir = isProduction
    ? fileURLToPath(new URL('../../cafe-aramesh-final-task/dist/', import.meta.url))
    : undefined
  const server = createApp({ staticDir }).listen(port, '127.0.0.1', () =>
    console.log(`Cafe API: http://localhost:${port}/api`)
  )

  server.on('error', (error) => {
    console.error(error.message)
    mongoose.disconnect().finally(() => process.exit(1))
  })

  // Graceful shutdown: finish open requests, close the database, then exit.
  const shutdown = () => {
    server.close(async () => {
      await mongoose.disconnect()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000).unref()
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
} catch (error) {
  console.error('Cannot start Cafe API. Check MongoDB and MONGODB_URI.', error.message)
  await mongoose.disconnect()
  process.exitCode = 1
}
