import mongoose from 'mongoose'

export function getHealth() {
  const ready = mongoose.connection.readyState === 1
  return { status: ready ? 'ok' : 'unavailable', database: ready ? 'connected' : 'disconnected' }
}
