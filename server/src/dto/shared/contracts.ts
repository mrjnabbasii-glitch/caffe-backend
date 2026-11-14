export interface UserSource {
  _id: { toString(): string }
  name: string
  username?: string | null
  email: string
}
export interface PublicUser {
  id: string
  name: string
  username: string | null
  email: string
}
export interface AuthResponse {
  user: PublicUser
}
export interface ReservationAddon {
  id: number
  title: string
  price: number
  quantity: number
}
export interface ReservationRecord {
  bookingId: string
  ownerHash: string
  customerName: string
  bookingTime: string
  addons: ReservationAddon[]
  tablePrice: number
  totalPrice: number
  createdAt: Date
}
export interface TableRecord {
  id: number
  title: string
  capacity: number
  price: number
  lockUntil?: Date | null
  reservation: ReservationRecord | null
}
export interface PublicTable {
  id: number
  title: string
  capacity: number
  price: number
  isReserved: boolean
  isLocked: boolean
}
export interface PublicReservation extends Omit<ReservationRecord, 'ownerHash'> {
  tableId: number
  tableTitle: string
  capacity: number
}
export interface MenuItemRecord {
  id: number
  title: string
  price: number
  category: string
  description: string
  icon: string
  isAddon: boolean
  available: boolean
}
export interface MenuResponse {
  items: MenuItemRecord[]
  timeOptions: string[]
}
export interface HealthResponse {
  status: 'ok' | 'unavailable'
  database: 'connected' | 'disconnected'
}
