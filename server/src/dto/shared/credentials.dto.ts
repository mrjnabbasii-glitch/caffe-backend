import { Transform } from 'class-transformer'
import { IsEmail, IsString, Length, MaxLength } from 'class-validator'
import { lowerText } from './validation.js'

export class CredentialsDto {
  @Transform(lowerText)
  @IsString({ message: 'ایمیل باید متن باشد.' })
  @IsEmail({}, { message: 'ایمیل معتبر وارد کنید.' })
  @MaxLength(254, { message: 'ایمیل بیش از حد طولانی است.' })
  email!: string

  // Passwords are exact secrets: spaces are preserved intentionally.
  @IsString({ message: 'رمز عبور باید متن باشد.' })
  @Length(8, 128, { message: 'رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد.' })
  password!: string
}
