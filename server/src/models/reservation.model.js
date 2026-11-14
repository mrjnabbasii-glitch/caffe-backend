import { Schema } from './database.js'
import { addonSchema } from './addon.model.js'

export const reservationSchema = new Schema(
  {
    bookingId: { type: String, required: true },
    ownerHash: { type: String, required: true },
    customerName: { type: String, required: true, maxlength: 60 },
    bookingTime: { type: String, required: true },
    addons: [addonSchema],
    tablePrice: Number,
    totalPrice: Number,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
)
