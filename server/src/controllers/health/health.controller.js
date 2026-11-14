import { getHealth } from '../../services/health/health.service.js'
import { parseRequest, toResponse } from '../../dto/health/health.dto.js'

export function handle(req, res) {
  parseRequest(req)
  const result = getHealth()
  res.status(result.status === 'ok' ? 200 : 503).json(toResponse(result))
}
