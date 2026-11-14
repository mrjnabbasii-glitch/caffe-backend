import { Table } from '../../models/table.model.js'

export async function releaseTable({ id }, ownerHash) {
  await Table.updateOne(
    { id, reservation: null, lockOwner: ownerHash },
    { $set: { lockOwner: null, lockUntil: null } }
  )
}
