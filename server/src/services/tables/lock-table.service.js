import { Table } from '../../models/table.model.js'
import { LOCK_MS } from '../../config/constants.js'
import { fail } from '../../utils/http-error.js'

export async function lockTable({ id }, ownerHash) {
  const now = new Date()
  // Repeating a request keeps the original expiry, never extends the hold.
  let table = await Table.findOne({
    id,
    reservation: null,
    lockOwner: ownerHash,
    lockUntil: { $gt: now }
  }).lean()
  if (!table)
    table = await Table.findOneAndUpdate(
      { id, reservation: null, $or: [{ lockUntil: null }, { lockUntil: { $lte: now } }] },
      { $set: { lockOwner: ownerHash, lockUntil: new Date(now.getTime() + LOCK_MS) } },
      { returnDocument: 'after' }
    ).lean()
  if (!table) fail(409, 'این میز رزرو شده یا در حال رزرو توسط شخص دیگری است.')
  return { table, expiresAt: table.lockUntil }
}
