import mongoose from 'mongoose'

const { Schema } = mongoose
mongoose.set('bufferCommands', false)
mongoose.set('autoCreate', false)
mongoose.set('autoIndex', false)

const addonSchema = new Schema({
  id: Number, title: String, price: Number, quantity: Number
}, { _id: false })

// The active reservation and its table are committed in one atomic MongoDB write.
// This also works on a standalone MongoDB installation without replica sets.
const reservationSchema = new Schema({
  bookingId: { type: String, required: true },
  ownerHash: { type: String, required: true },
  customerName: { type: String, required: true, maxlength: 60 },
  bookingTime: { type: String, required: true },
  addons: [addonSchema],
  tablePrice: Number,
  totalPrice: Number,
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const tableSchema = new Schema({
  id: { type: Number, unique: true, required: true },
  title: { type: String, required: true },
  capacity: { type: Number, required: true },
  price: { type: Number, required: true },
  lockOwner: { type: String, default: null },
  lockUntil: { type: Date, default: null },
  reservation: { type: reservationSchema, default: null }
}, { timestamps: true })
tableSchema.index({ 'reservation.bookingId': 1 }, { unique: true, partialFilterExpression: { 'reservation.bookingId': { $type: 'string' } } })
tableSchema.index({ 'reservation.ownerHash': 1 })

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

export const Table = mongoose.model('Table', tableSchema)
export const MenuItem = mongoose.model('MenuItem', menuSchema)

export async function seedDatabase() {
  const titles = ['میز دونفره لب پنجره', 'میز چهار نفره کنار دیوار', 'میز شش نفره خانوادگی', 'میز دونفره دنج', 'میز چهار نفره حیاط', 'میز شش نفره مخصوص گروه']
  const capacities = [2, 4, 6, 2, 4, 6]
  // Create collections and indexes only after the database connection is ready.
  await Promise.all([Table.createCollection(), MenuItem.createCollection()])
  await Promise.all([Table.createIndexes(), MenuItem.createIndexes()])
  await Table.bulkWrite(titles.map((title, i) => ({ updateOne: {
    filter: { id: i + 1 },
    update: { $setOnInsert: { id: i + 1, title, capacity: capacities[i], price: capacities[i] * 50000, reservation: null, lockOwner: null, lockUntil: null } },
    upsert: true
  } })))
  const items = [
    { id: 1, title: 'قهوه اسپرسو', price: 80000, category: 'نوشیدنی‌ها', icon: '☕', description: 'قهوه تازه و خوش‌عطر', isAddon: true },
    { id: 2, title: 'چیزکیک', price: 90000, category: 'دسرها', icon: '🍰', description: 'چیزکیک لطیف و خوشمزه', isAddon: true },
    { id: 3, title: 'ماکیاتو', price: 100000, category: 'نوشیدنی‌ها', icon: '☕', description: 'اسپرسو با شیر', isAddon: true },
    { id: 4, title: 'کیک روز', price: 70000, category: 'دسرها', icon: '🍰', description: 'کیک تازه روز', isAddon: true },
    { id: 5, title: 'کاپوچینو', price: 100000, category: 'نوشیدنی‌ها', icon: '🥛', description: 'اسپرسو با شیر و فوم' },
    { id: 6, title: 'چای', price: 50000, category: 'نوشیدنی‌ها', icon: '🍵', description: 'چای گرم و معطر' },
    { id: 7, title: 'کیک شکلاتی', price: 90000, category: 'دسرها', icon: '🍫', description: 'کیک شکلاتی تازه' },
    { id: 8, title: 'برگر', price: 180000, category: 'غذاها', icon: '🍔', description: 'برگر مخصوص کافه آرامش' },
    { id: 9, title: 'پاستا', price: 160000, category: 'غذاها', icon: '🍝', description: 'پاستای گرم با سس مخصوص' }
  ]
  await MenuItem.bulkWrite(items.map(item => ({ updateOne: {
    filter: { id: item.id }, update: { $setOnInsert: { ...item, available: true } }, upsert: true
  } })))
}
