import { MenuItem } from '../../models/menu-item.model.js'
import { TIMES } from '../../config/constants.js'

export async function getMenu() {
  const items = await MenuItem.find({ available: true }).select('-_id -__v').sort({ id: 1 }).lean()
  return { items, timeOptions: TIMES }
}
