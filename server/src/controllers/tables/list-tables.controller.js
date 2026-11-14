import { listTables } from '../../services/tables/list-tables.service.js'
import { parseRequest, toResponse } from '../../dto/tables/list-tables.dto.js'

export async function handle(req, res) {
  const input = parseRequest(req)
  const result = await listTables(input)
  res.json(toResponse(result))
}
