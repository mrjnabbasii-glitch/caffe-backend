import { Transform } from 'class-transformer'
import { IsInt, Min, Max } from 'class-validator'
import { tableIdNumber } from './validation.js'

export class TableIdDto {
  @Transform(tableIdNumber)
  @IsInt({ message: 'شناسه میز باید عدد صحیح باشد.' })
  @Min(1, { message: 'شناسه میز نامعتبر است.' })
  @Max(999999, { message: 'شناسه میز نامعتبر است.' })
  id!: number
}
