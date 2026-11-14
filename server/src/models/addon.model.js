import { Schema } from './database.js'

export const addonSchema = new Schema(
  {
    id: Number,
    title: String,
    price: Number,
    quantity: Number
  },
  { _id: false }
)
