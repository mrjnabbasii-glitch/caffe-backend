import windowTable from './photos/window-table.webp'
import wallTable from './photos/wall-table.webp'
import familyTable from './photos/family-table.webp'
import nookTable from './photos/nook-table.webp'
import courtyardTable from './photos/courtyard-table.webp'
import groupTable from './photos/group-table.webp'
import pondTable from './photos/pond-table.webp'

import cappuccino from './photos/cappuccino.webp'
import chocolateCake from './photos/chocolate-cake.webp'
import pasta from './photos/pasta.webp'
import icedLatte from './photos/iced-latte.webp'
import mojito from './photos/mojito.webp'
import tiramisu from './photos/tiramisu.webp'
import brownie from './photos/brownie.webp'
import caesar from './photos/caesar.webp'
import panini from './photos/panini.webp'

import espresso from './photos/espresso.webp'
import cheesecake from './photos/cheesecake.webp'
import macchiato from './photos/macchiato.webp'
import dailyCake from './photos/daily-cake.webp'
import tea from './photos/tea.webp'
import burger from './photos/burger.webp'

export const tablePhotos = {
  1: windowTable,
  2: wallTable,
  3: familyTable,
  4: nookTable,
  5: courtyardTable,
  6: groupTable,
  7: pondTable
}

import margherita from './photos/margherita.webp'
import pepperoni from './photos/pepperoni.webp'
import chickenMushroom from './photos/chicken-mushroom.webp'
import mineralWater from './photos/mineral-water.webp'
import latte from './photos/latte.webp'
import roastBeef from './photos/roast-beef.webp'
import mixedPizza from './photos/mixed-pizza.webp'
import baconBurger from './photos/bacon-burger.webp'
import cheeseBurger from './photos/cheese-burger.webp'
import chickenBurger from './photos/chicken-burger.webp'
import mushroomBurger from './photos/mushroom-burger.webp'
import chickenPanini from './photos/panini-chicken-mushroom.webp'
import roastBeefPanini from './photos/panini-roast-beef.webp'
import baconPanini from './photos/panini-bacon-cheese.webp'
import tonguePanini from './photos/panini-tongue.webp'
import previewPhoto31 from './photos/pasta-chicken-alfredo.webp'
import previewPhoto32 from './photos/pasta-chicken-pesto.webp'
import previewPhoto33 from './photos/pasta-mac-cheese.webp'
import previewPhoto34 from './photos/pasta-beef-alfredo.webp'
import previewPhoto35 from './photos/cookie-walnut.webp'
import previewPhoto36 from './photos/cookie-double-chocolate.webp'
import previewPhoto37 from './photos/cookie-peanut.webp'
import previewPhoto38 from './photos/cookie-nutella.webp'
import previewPhoto39 from './photos/cookie-pistachio.webp'
import previewPhoto40 from './photos/salad-cabbage.webp'
import previewPhoto41 from './photos/salad-caesar-crispy.webp'
import previewPhoto42 from './photos/salad-seasonal.webp'
import previewPhoto43 from './photos/salad-pomegranate.webp'

import icedAmericano from './photos/iced-americano.webp'
import icedCaramelMacchiato from './photos/iced-caramel-macchiato.webp'
import coconutIcedLatte from './photos/coconut-iced-latte.webp'
import lemonade from './photos/lemonade.webp'

export const menuPhotos = {
  1: espresso,
  2: cheesecake,
  3: macchiato,
  4: dailyCake,
  5: cappuccino,
  6: tea,
  7: chocolateCake,
  8: burger,
  9: pasta,
  10: icedLatte,
  11: mojito,
  12: tiramisu,
  13: brownie,
  14: caesar,
  15: panini,
  16: margherita,
  17: pepperoni,
  18: chickenMushroom,
  19: mineralWater,
  20: latte,
  21: roastBeef,
  22: mixedPizza,
  23: baconBurger,
  24: cheeseBurger,
  25: chickenBurger,
  26: mushroomBurger,
  27: chickenPanini,
  28: roastBeefPanini,
  29: baconPanini,
  30: tonguePanini,
  31: previewPhoto31,
  32: previewPhoto32,
  33: previewPhoto33,
  34: previewPhoto34,
  35: previewPhoto35,
  36: previewPhoto36,
  37: previewPhoto37,
  38: previewPhoto38,
  39: previewPhoto39,
  40: previewPhoto40,
  41: previewPhoto41,
  42: previewPhoto42,
  43: previewPhoto43,
  44: icedAmericano,
  45: icedCaramelMacchiato,
  46: coconutIcedLatte,
  47: lemonade
}

export function menuPhotoFor(item) {
  return menuPhotos[item.id]
}
