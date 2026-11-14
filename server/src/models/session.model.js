import mongoose, { Schema } from './database.js'

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    passwordVersion: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
export const Session = mongoose.model('Session', sessionSchema)
