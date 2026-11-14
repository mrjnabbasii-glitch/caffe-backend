import mongoose from 'mongoose'

// Fail fast instead of queueing queries while disconnected; seed.js creates
// collections and indexes explicitly after the connection is ready.
mongoose.set('bufferCommands', false)
mongoose.set('autoCreate', false)
mongoose.set('autoIndex', false)
export const { Schema } = mongoose
export default mongoose
