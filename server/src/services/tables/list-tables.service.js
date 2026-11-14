import { Table } from '../../models/table.model.js'

export async function listTables({ filter }) {
  return { tables: await Table.find(filter).sort({ id: 1 }).lean() }
}
