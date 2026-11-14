import { createReservation } from '../../services/reservations/create-reservation.service.js'
import { parseRequest, toResponse } from '../../dto/reservations/create-reservation.dto.js'

export async function handle(req, res) {
  const input = parseRequest(req)
  const result = await createReservation(input, req.ownerHash)
  res.status(result.created ? 201 : 200).json(toResponse(result))
}
