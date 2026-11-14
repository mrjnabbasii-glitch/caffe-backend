import { IsString, Length } from 'class-validator'

export class PasswordValueDto {
  @IsString({ message: 'رمز عبور باید متن باشد.' })
  @Length(8, 128, { message: 'رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد.' })
  password!: string
}
