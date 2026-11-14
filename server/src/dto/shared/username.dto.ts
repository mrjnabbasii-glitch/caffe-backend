import { Transform } from 'class-transformer'
import { IsString, Matches } from 'class-validator'
import { usernameText, validateDto } from './validation.js'

export class UsernameValueDto {
  @Transform(usernameText)
  @IsString({ message: 'نام کاربری باید متن باشد.' })
  @Matches(/^\p{L}[\p{L}\p{N}_]{2,29}$/u, {
    message: 'نام کاربری باید ۳ تا ۳۰ حرف، عدد یا زیرخط باشد و با حرف شروع شود.'
  })
  username!: string
}
export function usernameInput(value: unknown): string {
  return validateDto(UsernameValueDto, { username: value }).username
}
