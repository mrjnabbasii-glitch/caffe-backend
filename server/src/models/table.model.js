import mongoose, { Schema } from './database.js'
import { reservationSchema } from './reservation.model.js'

const tableSchema = new Schema(
  {
    id: { type: Number, unique: true, required: true },
    title: { type: String, required: true },
    capacity: { type: Number, required: true },
    price: { type: Number, required: true },
    lockOwner: { type: String, default: null },
    lockUntil: { type: Date, default: null },
    reservation: { type: reservationSchema, default: null }
  },
  { timestamps: true }
)
tableSchema.index(
  { 'reservation.bookingId': 1 },
  { unique: true, partialFilterExpression: { 'reservation.bookingId': { $type: 'string' } } }
)
tableSchema.index({ 'reservation.ownerHash': 1 })

export const Table = mongoose.model('Table', tableSchema)
