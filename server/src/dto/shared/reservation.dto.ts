import type { TableRecord, PublicReservation } from './contracts.js'

export function publicReservation(table: TableRecord): PublicReservation {
  if (!table.reservation) throw new Error('Reservation data is missing.')
  const { ownerHash: _ownerHash, ...reservation } = table.reservation
  return { ...reservation, tableId: table.id, tableTitle: table.title, capacity: table.capacity }
}
