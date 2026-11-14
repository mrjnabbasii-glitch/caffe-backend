import type { Request } from 'express'
import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested
} from 'class-validator'
import { trimText, validateDto } from '../shared/validation.js'
import { TIMES } from '../../config/constants.js'
import { publicReservation } from '../shared/reservation.dto.js'
import type { TableRecord, PublicReservation } from '../shared/contracts.js'

export class ReservationAddonRequestDto {
  @IsInt({ message: 'شناسه پذیرایی باید عدد صحیح باشد.' })
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  id!: number
  @IsInt({ message: 'تعداد پذیرایی باید عدد صحیح باشد.' })
  @Min(1, { message: 'تعداد پذیرایی باید بین ۱ تا ۲۰ باشد.' })
  @Max(20, { message: 'تعداد پذیرایی باید بین ۱ تا ۲۰ باشد.' })
  quantity!: number
}
export class CreateReservationRequestDto {
  @IsInt({ message: 'شناسه میز باید عدد صحیح باشد.' })
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  tableId!: number
  @Transform(trimText)
  @IsString({ message: 'نام مشتری باید متن باشد.' })
  @Length(3, 60, { message: 'نام مشتری باید بین ۳ تا ۶۰ حرف باشد.' })
  customerName!: string
  @Transform(trimText)
  @IsString()
  @IsIn(TIMES, { message: 'ساعت حضور نامعتبر است.' })
  bookingTime!: string
  @IsArray({ message: 'اقلام پذیرایی باید آرایه باشد.' })
  @ArrayMaxSize(20)
  @ArrayUnique((item: ReservationAddonRequestDto | null) => item?.id, {
    message: 'اقلام پذیرایی تکراری مجاز نیست.'
  })
  @ValidateNested({ each: true })
  @Type(() => ReservationAddonRequestDto)
  addons: ReservationAddonRequestDto[] = []
}
export interface CreateReservationInput {
  id: number
  customerName: string
  bookingTime: string
  addons: ReservationAddonRequestDto[]
}
export function parseRequest(req: Request): CreateReservationInput {
  const input = validateDto(CreateReservationRequestDto, req.body)
  return {
    id: input.tableId,
    customerName: input.customerName,
    bookingTime: input.bookingTime,
    addons: input.addons
  }
}
export function toResponse(value: { reservation: TableRecord }): {
  reservation: PublicReservation
} {
  return { reservation: publicReservation(value.reservation) }
}
