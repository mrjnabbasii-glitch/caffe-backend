import type { Request } from 'express'
import { TableIdDto } from '../shared/table-id.dto.js'
import { validateDto } from '../shared/validation.js'
import { publicTable } from '../shared/table.dto.js'
import type { TableRecord, PublicTable } from '../shared/contracts.js'

export class LockTableRequestDto extends TableIdDto {}
export function parseRequest(req: Request): LockTableRequestDto {
  return validateDto(LockTableRequestDto, req.params)
}
export function toResponse(value: { table: TableRecord; expiresAt: Date }): {
  table: PublicTable
  expiresAt: Date
} {
  return { table: publicTable(value.table), expiresAt: value.expiresAt }
}
