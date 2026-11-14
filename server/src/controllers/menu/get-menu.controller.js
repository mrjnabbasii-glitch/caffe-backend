import { getMenu } from '../../services/menu/get-menu.service.js'
import { parseRequest, toResponse } from '../../dto/menu/get-menu.dto.js'

export async function handle(req, res) {
  parseRequest(req)
  const result = await getMenu()
  res.json(toResponse(result))
}
