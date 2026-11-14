# کافه آرامش

سامانهٔ رزرو میز کافه با Vue 3، Pinia، Quasar، Express 5، TypeScript و MongoDB.

## طراحی و داده‌های نمونه

صفحهٔ اصلی، منو و فرم رزرو با چیدمان راست‌چین و واکنش‌گرا طراحی شده‌اند. مهمان می‌تواند میزها را ببیند و با انتخاب میز به ورود یا ثبت‌نام هدایت شود. پس از ورود، میز انتخابی آمادهٔ ادامهٔ رزرو است.

منو ۴۷ آیتم و فهرست رزرو ۷ میز دارد. عکس هر میز بر اساس شناسهٔ دادهٔ اولیه در `src/assets/cafePhotos.js` فرانت‌اند تنظیم می‌شود. در اجرای سرور، نام، قیمت، دسته‌بندی و ترکیبات اقلام منوی پیش‌فرض به‌روزرسانی می‌شوند. میزها، رزروها، حساب‌ها و وضعیت موجودی اقلام قبلی حفظ می‌شوند.

## اجرا (ویندوز)

Node.js نسخهٔ ۲۲ یا بالاتر لازم است. در پوشهٔ اصلی پروژه:

```powershell
npm.cmd run setup      # نصب وابستگی‌های بک‌اند و فرانت‌اند
npm.cmd run dev:local  # راه‌اندازی MongoDB محلی + API + سایت
```

یا فایل `START-WINDOWS.cmd` را اجرا کنید.

- سایت: `http://localhost:5173`
- API: `http://localhost:3000/api`
- مستندات Swagger (فقط در توسعه): `http://localhost:3000/api/docs`

مستندات Swagger در `server/src/docs/openapi.js` نوشته شده و همهٔ APIها را با ورودی، خروجی و کدهای وضعیت نشان می‌دهد. با دکمهٔ «Try it out» می‌توان هر API را از همان صفحه امتحان کرد.

`dev:local` یک MongoDB محلی می‌سازد و داده‌ها را در `server/.local-db` نگه می‌دارد (اجرای اول باینری MongoDB را دانلود می‌کند). بعد از تغییر کد بک‌اند در این حالت، فرمان را دوباره اجرا کنید. اگر MongoDB از قبل دارید، `server/.env.example` را به `server/.env` کپی کنید، `MONGODB_URI` را تنظیم کنید و `npm.cmd run dev` بزنید. با Docker: `docker compose up -d` و بعد `npm.cmd run dev`.

پورت فرانت‌اند روی ۵۱۷۳ ثابت است چون بررسی Origin در سرور به همین نشانی وابسته است. اگر آن را عوض کردید، `APP_ORIGIN` را هم عوض کنید.

## بررسی و بیلد

```powershell
npm.cmd install           # فقط Prettier را در ریشه نصب می‌کند
npm.cmd run format:check  # بررسی فرمت کد
npm.cmd run typecheck     # بررسی تایپ DTOها
npm.cmd test              # build بک‌اند + اجرای تست‌ها روی دیتابیس آزمایشی جدا
npm.cmd run build         # build بک‌اند (server/dist) و فرانت‌اند (dist)
```

## ساختار پروژه

```text
cafe-aramesh-final-task/src/      فرانت‌اند (Vue)
  main.js          ساخت اپ، نصب Pinia/Router/Quasar
  router/          مسیرها و محافظت صفحه‌های شخصی
  services/api.js  تنها جایی که با سرور حرف می‌زند (Axios)
  stores/          وضعیت مشترک: authStore (کاربر)، bookingStore (میز، منو، رزرو)
  layouts/         قالب صفحه‌ها
  views/           صفحه‌ها (AuthView.vue برای ورود، ثبت‌نام و بازیابی رمز)
  components/      اجزای قابل استفادهٔ مجدد
  composables/     منطق قابل استفادهٔ مجدد (تایمر قفل موقت)

server/src/                       بک‌اند (Express)
  index.js         اتصال به MongoDB و روشن‌کردن سرور
  app.js           تنظیم Express و ترتیب middlewareها
  seed.js          ساخت collectionها، indexها و دادهٔ اولیهٔ میز و منو
  config/          ثابت‌ها (ساعت‌های رزرو، مدت قفل)
  routes/          نگاشت URL به کنترلر؛ auth.routes.ts ماژول احراز هویت
  controllers/     دریافت درخواست HTTP ← فراخوانی سرویس ← ارسال پاسخ
  dto/             اعتبارسنجی ورودی (class-validator) و ساخت خروجی امن
  services/        منطق اصلی و کار با دیتابیس
  models/          schemaهای Mongoose
  middleware/      بررسی Origin و مدیریت خطا
  utils/           هش رمز و ساخت خطای HTTP

server/test/       تست‌های خودکار (node:test + supertest)
scripts/           اسکریپت‌های اجرای هم‌زمان API و Vite در توسعه
```

## مسیر یک درخواست

```text
مرورگر (Vue) → api.js → پراکسی Vite → Express
  → middlewareها (helmet، محدودیت نرخ، JSON، Origin)
  → router → [requireAuth] → controller
  → dto.parseRequest (اعتبارسنجی) → service (MongoDB) → dto.toResponse
  → JSON به مرورگر   (هر خطا → error-handler)
```

## APIها

| متد | مسیر | ورود لازم | توضیح |
|---|---|---|---|
| POST | `/api/auth/signup` | خیر | ثبت‌نام و ورود خودکار (`/register` نام قدیمی همین مسیر است) |
| POST | `/api/auth/login` | خیر | ورود با نام کاربری یا ایمیل |
| GET | `/api/auth/me` | بله | کاربر فعلی |
| POST | `/api/auth/logout` | خیر | خروج (تکرار آن بی‌خطر است) |
| POST | `/api/auth/forgot-password` | خیر | درخواست لینک بازیابی؛ پاسخ همیشه ۲۰۲ |
| POST | `/api/auth/reset-password` | خیر | ثبت رمز جدید با توکن لینک |
| GET | `/api/health` | خیر | وضعیت سرور و دیتابیس |
| GET | `/api/menu` | خیر | منو و ساعت‌های مجاز |
| GET | `/api/tables?capacity=2` | خیر | فهرست میزها |
| POST | `/api/tables/:id/lock` | بله | قفل موقت ۵ دقیقه‌ای میز |
| DELETE | `/api/tables/:id/lock` | بله | آزادکردن قفل |
| POST | `/api/reservations` | بله | ثبت رزرو (نیاز به قفل معتبر) |
| GET | `/api/reservations` | بله | رزروهای من |
| GET | `/api/reservations/:bookingId` | بله | رسید یک رزرو |

نمونهٔ بدنه‌ها:

```json
{ "username": "cafe_customer", "email": "customer@example.com", "password": "a-long-password" }
{ "identifier": "cafe_customer", "password": "a-long-password" }
{ "tableId": 1, "customerName": "نام مشتری", "bookingTime": "18:00", "addons": [{ "id": 1, "quantity": 2 }] }
```

## امنیت در یک نگاه

- رمز با `scrypt` و salt تصادفی هش می‌شود؛ رمز اصلی هیچ‌جا ذخیره نمی‌شود.
- نشست: توکن تصادفی در کوکی `HttpOnly` + `SameSite=Strict` (+ `Secure` در production)؛ در دیتابیس فقط هش توکن. اعتبار ۷ روز.
- درخواست‌های تغییردهنده فقط از مبدأ خود سایت پذیرفته می‌شوند (`Origin` و `Sec-Fetch-Site`).
- قیمت‌ها و مالک رزرو فقط در سرور تعیین می‌شوند؛ کلاینت نمی‌تواند آن‌ها را بفرستد.
- قفل و رزرو با یک به‌روزرسانی اتمیک MongoDB انجام می‌شوند، پس دو نفر هم‌زمان یک میز را نمی‌گیرند.
- لینک بازیابی رمز ۱۵ دقیقه اعتبار دارد، یک‌بارمصرف است و پس از تغییر رمز همهٔ نشست‌ها باطل می‌شوند.
- تعداد درخواست‌ها محدود است (کلی و جداگانه برای ورود و بازیابی).

## ایمیل بازیابی رمز

در توسعه (یا بدون تنظیم SMTP) ایمیل ارسال نمی‌شود و پیام در `server/.local-mail/*.json` ذخیره می‌شود؛ لینک را از همان فایل باز کنید. این پوشه حساس است و در Git نیست.

برای ارسال واقعی در `server/.env`: `MAIL_MODE=smtp`، `APP_ORIGIN` با HTTPS، و `SMTP_HOST`، `SMTP_PORT`، `SMTP_USER`، `SMTP_PASSWORD`، `MAIL_FROM`. پورت ۴۶۵ TLS مستقیم و ۵۸۷ STARTTLS است.

## اجرای production

`npm.cmd run build` و سپس در `server/.env`:

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/cafe_aramesh
NODE_ENV=production
APP_ORIGIN=https://your-domain.example
```

بعد `npm.cmd start`. بک‌اند فایل‌های build فرانت‌اند را هم سرو می‌کند. سرور روی `127.0.0.1` گوش می‌دهد؛ یک reverse proxy با HTTPS جلوی آن بگذارید (کوکی Secure به HTTPS نیاز دارد).

## محدودیت‌های فعلی

- هر میز فقط یک رزرو فعال دارد؛ تقویم چندروزه و لغو رزرو پیاده نشده‌اند.
- تأیید ایمیل هنگام ثبت‌نام وجود ندارد.
- حساب‌های قدیمیِ بدون نام کاربری فقط با ایمیل وارد می‌شوند.
