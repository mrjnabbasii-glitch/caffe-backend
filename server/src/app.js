import express from 'express'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { openApiDocument } from './docs/openapi.js'
import createApiRouter from './routes/index.js'
import { sameOrigin } from './middleware/same-origin.js'
import { errorHandler } from './middleware/error-handler.js'

// Builds the Express app without starting a server, so tests can use it directly.
export function createApp({ staticDir, sendResetEmail } = {}) {
  const app = express()
  app.disable('x-powered-by')

  // Interactive API documentation (Swagger UI) at /api/docs, only outside production.
  // Mounted before helmet because helmet's strict content-security rules block the
  // Swagger page's scripts and styles.
  if (process.env.NODE_ENV !== 'production') {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))
  }

  app.use(helmet())

  // Middleware order matters: every /api request passes through these, top to bottom.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 180,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { message: 'درخواست‌های زیادی ارسال شده است؛ کمی صبر کنید.' }
    })
  )
  app.use(express.json({ limit: '16kb' }))
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  app.use('/api', sameOrigin)
  app.use('/api', createApiRouter({ sendResetEmail }))
  app.use('/api', (_req, res) => res.status(404).json({ message: 'مسیر مورد نظر پیدا نشد.' }))

  // In production the same server also serves the built Vue app.
  if (staticDir) {
    app.use(express.static(staticDir))
    app.get('/{*path}', (_req, res) => res.sendFile('index.html', { root: staticDir }))
  }

  app.use(errorHandler) // Must be last: receives every thrown error.
  return app
}
