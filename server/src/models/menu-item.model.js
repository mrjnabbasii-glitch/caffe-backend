import mongoose, { Schema } from './database.js'

const menuSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  title: String,
  price: Number,
  category: String,
  description: String,
  icon: String,
  isAddon: { type: Boolean, default: false },
  available: { type: Boolean, default: true }
})

export const MenuItem = mongoose.model('MenuItem', menuSchema)
