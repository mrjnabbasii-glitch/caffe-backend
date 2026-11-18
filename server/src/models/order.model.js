import mongoose, { Schema } from './database.js'

const lineSchema = new Schema({
  id: Number,
  title: String,
  quantity: Number,
  unitPrice: Number
}, { _id: false })

const orderSchema = new Schema({
  ownerHash: { type: String, required: true },
  checkoutKey: { type: String, required: true },
  items: { type: [lineSchema], required: true },
  total: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
})
orderSchema.index({ ownerHash: 1, checkoutKey: 1 }, { unique: true })

orderSchema.index({ createdAt: -1, _id: -1 })
orderSchema.index({ ownerHash: 1, _id: -1 })

export const Order = mongoose.model('Order', orderSchema)
