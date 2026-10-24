import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { seedDatabase } from './models.js'

const port = Number(process.env.PORT || 3000)
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cafe_aramesh', { serverSelectionTimeoutMS: 5000 })
  await seedDatabase()
  const staticDir = process.env.NODE_ENV === 'production' ? fileURLToPath(new URL('../../cafe-aramesh-final-task/dist/', import.meta.url)) : undefined
  const server = createApp({ staticDir }).listen(port, '127.0.0.1', () => console.log(`Cafe API: http://localhost:${port}/api`))
  server.on('error', error => { console.error(error.message); mongoose.disconnect().finally(() => process.exit(1)) })
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    server.close(async () => { await mongoose.disconnect(); process.exit(0) })
    setTimeout(() => process.exit(1), 10000).unref()
  })
} catch (error) {
  console.error('Cannot start Cafe API. Check MongoDB and MONGODB_URI.', error.message)
  await mongoose.disconnect()
  process.exitCode = 1
}
