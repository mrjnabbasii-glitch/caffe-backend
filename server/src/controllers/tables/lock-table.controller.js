import { lockTable } from '../../services/tables/lock-table.service.js'
import { parseRequest, toResponse } from '../../dto/tables/lock-table.dto.js'

export async function handle(req, res) {
  const input = parseRequest(req)
  const result = await lockTable(input, req.ownerHash)
  res.json(toResponse(result))
}
