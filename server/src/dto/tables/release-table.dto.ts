import type { Request } from 'express'
import { TableIdDto } from '../shared/table-id.dto.js'
import { validateDto } from '../shared/validation.js'

export class ReleaseTableRequestDto extends TableIdDto {}
export function parseRequest(req: Request): ReleaseTableRequestDto {
  return validateDto(ReleaseTableRequestDto, req.params)
}
export function toResponse(): void {}
