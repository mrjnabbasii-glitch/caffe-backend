import type { Request } from 'express'
import { Transform } from 'class-transformer'
import { IsIn, IsInt, IsOptional } from 'class-validator'
import { validateDto, tableIdNumber } from '../shared/validation.js'
import { publicTable } from '../shared/table.dto.js'
import type { TableRecord, PublicTable } from '../shared/contracts.js'

export class ListTablesRequestDto {
  @IsOptional()
  @Transform(tableIdNumber)
  @IsInt({ message: 'ظرفیت باید عدد باشد.' })
  @IsIn([2, 4, 6], { message: 'ظرفیت باید ۲، ۴ یا ۶ باشد.' })
  capacity?: number
}
export function parseRequest(req: Request): { filter: { capacity?: number } } {
  const input = validateDto(ListTablesRequestDto, req.query)
  return { filter: input.capacity === undefined ? {} : { capacity: input.capacity } }
}
export function toResponse(value: { tables: TableRecord[] }): { tables: PublicTable[] } {
  return { tables: value.tables.map(publicTable) }
}
