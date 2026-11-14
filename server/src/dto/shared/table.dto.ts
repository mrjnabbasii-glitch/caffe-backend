import type { TableRecord, PublicTable } from './contracts.js'

export function publicTable(table: TableRecord): PublicTable {
  return {
    id: table.id,
    title: table.title,
    capacity: table.capacity,
    price: table.price,
    isReserved: Boolean(table.reservation),
    isLocked: !table.reservation && (table.lockUntil?.getTime() ?? 0) > Date.now()
  }
}
