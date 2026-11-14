import type { Request } from 'express'
import { publicReservation } from '../shared/reservation.dto.js'
import type { TableRecord, PublicReservation } from '../shared/contracts.js'

export class ListReservationsRequestDto {}
export function parseRequest(_req: Request): ListReservationsRequestDto {
  return new ListReservationsRequestDto()
}
export function toResponse(value: { reservations: TableRecord[] }): {
  reservations: PublicReservation[]
} {
  return { reservations: value.reservations.map(publicReservation) }
}
