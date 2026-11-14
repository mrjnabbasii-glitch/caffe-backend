import { Table } from '../../models/table.model.js'
import { fail } from '../../utils/http-error.js'

export async function getReservation({ bookingId }, ownerHash) {
  const table = await Table.findOne({
    'reservation.bookingId': bookingId,
    'reservation.ownerHash': ownerHash
  }).lean()
  if (!table) fail(404, 'رزرو پیدا نشد.')
  return { reservation: table }
}
