import type { Request } from 'express'
import type { HealthResponse } from '../shared/contracts.js'

export class HealthRequestDto {}
export function parseRequest(_req: Request): HealthRequestDto {
  return new HealthRequestDto()
}
export function toResponse(value: HealthResponse): HealthResponse {
  return { status: value.status, database: value.database }
}
