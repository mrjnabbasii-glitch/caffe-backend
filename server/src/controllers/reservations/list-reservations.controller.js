import { listReservations } from '../../services/reservations/list-reservations.service.js'
import { parseRequest, toResponse } from '../../dto/reservations/list-reservations.dto.js'

export async function handle(req, res) {
  parseRequest(req)
  const result = await listReservations(req.ownerHash)
  res.json(toResponse(result))
}
