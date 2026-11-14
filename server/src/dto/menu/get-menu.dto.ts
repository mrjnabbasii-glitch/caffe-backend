import type { Request } from 'express'
import type { MenuResponse } from '../shared/contracts.js'

export class GetMenuRequestDto {}
export function parseRequest(_req: Request): GetMenuRequestDto {
  return new GetMenuRequestDto()
}
export function toResponse(value: MenuResponse): MenuResponse {
  return {
    items: value.items.map(
      ({ id, title, price, category, description, icon, isAddon, available }) => ({
        id,
        title,
        price,
        category,
        description,
        icon,
        isAddon,
        available
      })
    ),
    timeOptions: value.timeOptions
  }
}
