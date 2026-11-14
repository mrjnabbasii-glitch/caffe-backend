import { getReservation } from '../../services/reservations/get-reservation.service.js'
import { parseRequest, toResponse } from '../../dto/reservations/get-reservation.dto.js'

export async function handle(req, res) {
  const input = parseRequest(req)
  const result = await getReservation(input, req.ownerHash)
  res.json(toResponse(result))
}
