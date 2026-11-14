import { Table } from '../../models/table.model.js'

export async function listReservations(ownerHash) {
  const tables = await Table.find({ 'reservation.ownerHash': ownerHash })
    .sort({ 'reservation.createdAt': -1 })
    .lean()
  return { reservations: tables }
}
