import { Table } from './models/table.model.js'
import { MenuItem } from './models/menu-item.model.js'
import { User } from './models/user.model.js'
import { Session } from './models/session.model.js'

const TABLES = [
  { id: 1, title: 'میز دونفره لب پنجره', capacity: 2 },
  { id: 2, title: 'میز چهار نفره کنار دیوار', capacity: 4 },
  { id: 3, title: 'میز شش نفره خانوادگی', capacity: 6 },
  { id: 4, title: 'میز دونفره دنج', capacity: 2 },
  { id: 5, title: 'میز چهار نفره حیاط', capacity: 4 },
  { id: 6, title: 'میز شش نفره مخصوص گروه', capacity: 6 },
  { id: 7, title: 'میز چهار نفره کنار حوض', capacity: 4 }
]
const PRICE_PER_SEAT = 50000

// isAddon: true means the item can be added to a reservation as a hospitality package.
const MENU_ITEMS = [
  {"isAddon":true,"id":1,"title":"قهوه اسپرسو","price":150000,"category":"نوشیدنی‌ها","icon":"☕","description":"قهوهٔ آسیاب‌شده و آب"},
  {"isAddon":true,"id":2,"title":"چیزکیک سن‌سباستین","price":250000,"category":"کیک و کوکی","icon":"🍰","description":"پنیر خامه‌ای، خامه، تخم‌مرغ و شکر"},
  {"isAddon":true,"id":3,"title":"ماکیاتو","price":100000,"category":"نوشیدنی‌ها","icon":"☕","description":"اسپرسو و فوم شیر"},
  {"isAddon":true,"id":4,"title":"کیک روز","price":150000,"category":"کیک و کوکی","icon":"🍰","description":"بسته به کیک روز؛ از کافه بپرسید."},
  {"isAddon":false,"id":5,"title":"کاپوچینو","price":160000,"category":"نوشیدنی‌ها","icon":"🥛","description":"اسپرسو، شیر بخارداده و فوم شیر"},
  {"isAddon":false,"id":6,"title":"چای","price":130000,"category":"نوشیدنی‌ها","icon":"🍵","description":"چای سیاه و آب"},
  {"isAddon":false,"id":7,"title":"کیک شکلاتی","price":170000,"category":"کیک و کوکی","icon":"🍫","description":"آرد، کاکائو، تخم‌مرغ، شکر و شکلات"},
  {"isAddon":false,"id":8,"title":"برگر","price":550000,"category":"برگرها","icon":"🍔","description":"نان برگر، گوشت گریل، کاهو، گوجه و سس"},
  {"isAddon":false,"id":9,"title":"پاستا","price":470000,"category":"پاستاها","icon":"🍝","description":"پاستا، سس گوجه، ریحان و پنیر"},
  {"isAddon":false,"id":10,"title":"آیس لاته","price":180000,"category":"نوشیدنی‌ها","icon":"🧊","description":"اسپرسو، شیر سرد و یخ"},
  {"isAddon":false,"id":11,"title":"موهیتو","price":200000,"category":"نوشیدنی‌ها","icon":"🌿","description":"لیمو، نعناع، شکر، آب گازدار و یخ"},
  {"isAddon":false,"id":12,"title":"تیرامیسو","price":240000,"category":"کیک و کوکی","icon":"🍰","description":"لیدی‌فینگر، قهوه، ماسکارپونه و کاکائو"},
  {"isAddon":false,"id":13,"title":"براونی شکلاتی","price":150000,"category":"کیک و کوکی","icon":"🍫","description":"شکلات تلخ، کره، آرد، تخم‌مرغ و شکر"},
  {"isAddon":false,"id":14,"title":"سالاد سزار با مرغ گریل","price":650000,"category":"سالادها","icon":"🥗","description":"کاهو، مرغ گریل، پارمزان، نان برشته و سس سزار"},
  {"isAddon":false,"id":15,"title":"پنینی مرغ و پستو","price":450000,"category":"پنینی‌ها","icon":"🥪","description":"نان برشته با مرغ گریل و سس پستو"},
  {"isAddon":false,"id":16,"title":"پیتزا مارگاریتا","price":550000,"category":"پیتزاها","icon":"🍕","description":"سس گوجه‌فرنگی، پنیر موزارلا و ریحان تازه"},
  {"isAddon":false,"id":17,"title":"پیتزا پپرونی","price":600000,"category":"پیتزاها","icon":"🍕","description":"پپرونی، پنیر موزارلا و سس گوجه‌فرنگی"},
  {"isAddon":false,"id":18,"title":"پیتزا مرغ و قارچ","price":750000,"category":"پیتزاها","icon":"🍕","description":"مرغ گریل، قارچ ورقه‌ای و پنیر موزارلا"},
  {"isAddon":false,"id":19,"title":"آب معدنی","price":20000,"category":"نوشیدنی‌ها","icon":"💧","description":"آب معدنی"},
  {"isAddon":false,"id":20,"title":"لاته","price":200000,"category":"نوشیدنی‌ها","icon":"☕","description":"اسپرسو و شیر بخارداده با لایهٔ نازک فوم"},
  {"isAddon":false,"id":21,"title":"پیتزا رست‌بیف","price":890000,"category":"پیتزاها","icon":"🍕","description":"ورقه‌های رست‌بیف، پیاز کاراملی و پنیر موزارلا"},
  {"isAddon":false,"id":22,"title":"پیتزا مخلوط","price":800000,"category":"پیتزاها","icon":"🍕","description":"سوسیس گوشت، قارچ، فلفل دلمه‌ای و پنیر موزارلا"},
  {"isAddon":false,"id":23,"title":"بیکن برگر","price":789000,"category":"برگرها","icon":"🍔","description":"برگر گوشت، بیکن گوشت برشته، پنیر چدار و کاهو"},
  {"isAddon":false,"id":24,"title":"چیز برگر","price":712000,"category":"برگرها","icon":"🍔","description":"برگر گوشت گریل‌شده، پنیر چدار و خیارشور"},
  {"isAddon":false,"id":25,"title":"چیکن برگر","price":550000,"category":"برگرها","icon":"🍔","description":"فیلهٔ مرغ سوخاری، کاهو و سس مخصوص"},
  {"isAddon":false,"id":26,"title":"ماشروم برگر","price":610000,"category":"برگرها","icon":"🍔","description":"برگر گوشت، قارچ تفت‌داده و پنیر"},
  {"isAddon":false,"id":27,"category":"پنینی‌ها","title":"پنینی مرغ و قارچ","price":400000,"description":"مرغ گریل، قارچ و موزارلا"},
  {"isAddon":false,"id":28,"category":"پنینی‌ها","title":"پنینی رست‌بیف","price":480000,"description":"رست‌بیف، پیاز کاراملی و پنیر"},
  {"isAddon":false,"id":29,"category":"پنینی‌ها","title":"پنینی بیکن چیز","price":450000,"description":"بیکن گوشت و چدار"},
  {"isAddon":false,"id":30,"category":"پنینی‌ها","title":"پنینی زبان","price":650000,"description":"زبان گوساله، پنیر و خیارشور"},
  {"isAddon":false,"id":31,"category":"پاستاها","title":"پاستا چیکن آلفردو","price":650000,"description":"مرغ گریل، خامه و پارمزان"},
  {"isAddon":false,"id":32,"category":"پاستاها","title":"پاستا چیکن پستو","price":600000,"description":"مرغ گریل، ریحان و پارمزان"},
  {"isAddon":false,"id":33,"category":"پاستاها","title":"پاستا مک اند چیز","price":550000,"description":"ماکارونی، شیر، کره و چدار"},
  {"isAddon":false,"id":34,"category":"پاستاها","title":"پاستا بیف آلفردو","price":700000,"description":"گوشت، خامه و پارمزان"},
  {"isAddon":false,"id":35,"category":"کیک و کوکی","title":"کوکی رژیمی گردو","price":110000,"description":"جو دوسر و گردو"},
  {"isAddon":false,"id":36,"category":"کیک و کوکی","title":"کوکی دبل چاکلت","price":90000,"description":"کاکائو و تکه‌های شکلات"},
  {"isAddon":false,"id":37,"category":"کیک و کوکی","title":"کوکی رژیمی بادام‌زمینی","price":110000,"description":"جو دوسر و کرهٔ بادام‌زمینی"},
  {"isAddon":false,"id":38,"category":"کیک و کوکی","title":"کوکی نوتلا","price":90000,"description":"خمیر کوکی و کرم شکلات فندقی"},
  {"isAddon":false,"id":39,"category":"کیک و کوکی","title":"کوکی پسته","price":90000,"description":"خمیر کوکی و تکه‌های پسته"},
  {"isAddon":false,"id":40,"category":"سالادها","title":"سالاد کلم","price":80000,"description":"کلم، هویج و سس خامه‌ای"},
  {"isAddon":false,"id":41,"category":"سالادها","title":"سالاد سزار با فیله سوخاری","price":650000,"description":"کاهو، فیلهٔ سوخاری، پارمزان، نان برشته و سس سزار"},
  {"isAddon":false,"id":42,"category":"سالادها","title":"سالاد فصل","price":550000,"description":"کاهو، خیار، گوجه و هویج"},
  {"isAddon":false,"id":43,"category":"سالادها","title":"سالاد انار","price":500000,"description":"سبزیجات برگ‌دار، انار و گردو"},
  {"isAddon":false,"id":44,"category":"نوشیدنی‌های سرد","title":"آیس آمریکانو","price":18000,"description":"اسپرسو، آب سرد و یخ"},
  {"isAddon":false,"id":45,"category":"نوشیدنی‌های سرد","title":"آیس کارامل ماکیاتو","price":210000,"description":"اسپرسو، شیر سرد، سس کارامل و یخ"},
  {"isAddon":false,"id":46,"category":"نوشیدنی‌های سرد","title":"آیس لته نارگیل","price":230000,"description":"اسپرسو، شیر نارگیل و یخ"},
  {"isAddon":false,"id":47,"category":"نوشیدنی‌های سرد","title":"لیموناد","price":180000,"description":"آب لیموی تازه، شکر، آب و یخ"}
]

// Preserve existing tables and reservations when the server restarts.
function insertIfMissing(documents) {
  return documents.map((doc) => ({
    updateOne: { filter: { id: doc.id }, update: { $setOnInsert: doc }, upsert: true }
  }))
}

export async function seedDatabase() {
  const models = [Table, MenuItem, User, Session]
  // autoCreate/autoIndex are off (see models/database.js), so create them here, once connected.
  await Promise.all(models.map((model) => model.createCollection()))
  await Promise.all(models.map((model) => model.createIndexes()))

  const tables = TABLES.map((table) => ({
    ...table,
    price: table.capacity * PRICE_PER_SEAT,
    reservation: null,
    lockOwner: null,
    lockUntil: null
  }))

  await Table.bulkWrite(insertIfMissing(tables))
  await MenuItem.bulkWrite(
    MENU_ITEMS.map(({ id, ...details }) => ({
      updateOne: {
        filter: { id },
        update: { $set: details, $setOnInsert: { id, available: true } },
        upsert: true
      }
    }))
  )
}
