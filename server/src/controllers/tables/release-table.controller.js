import { releaseTable } from '../../services/tables/release-table.service.js'
import { parseRequest } from '../../dto/tables/release-table.dto.js'

export async function handle(req, res) {
  const input = parseRequest(req)
  await releaseTable(input, req.ownerHash)
  res.status(204).end()
}
