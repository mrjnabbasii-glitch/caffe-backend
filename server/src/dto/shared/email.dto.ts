import { Transform } from 'class-transformer'
import { IsEmail, IsString, MaxLength } from 'class-validator'
import { lowerText, validateDto } from './validation.js'

export class EmailValueDto {
  @Transform(lowerText)
  @IsString({ message: 'ایمیل باید متن باشد.' })
  @IsEmail({}, { message: 'ایمیل معتبر وارد کنید.' })
  @MaxLength(254)
  email!: string
}
export function emailInput(value: unknown): string {
  return validateDto(EmailValueDto, { email: value }).email
}
