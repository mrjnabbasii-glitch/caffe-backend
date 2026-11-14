import type { Request } from 'express'
import { Transform } from 'class-transformer'
import { IsString, Matches } from 'class-validator'
import { trimText, validateDto } from '../shared/validation.js'
import { publicReservation } from '../shared/reservation.dto.js'
import type { TableRecord, PublicReservation } from '../shared/contracts.js'

export class GetReservationRequestDto {
  @Transform(trimText)
  @IsString({ message: 'شناسه رزرو نامعتبر است.' })
  @Matches(/^CAFE-[A-F0-9]{24}$/, { message: 'شناسه رزرو نامعتبر است.' })
  bookingId!: string
}
export function parseRequest(req: Request): GetReservationRequestDto {
  return validateDto(GetReservationRequestDto, req.params)
}
export function toResponse(value: { reservation: TableRecord }): {
  reservation: PublicReservation
} {
  return { reservation: publicReservation(value.reservation) }
}
