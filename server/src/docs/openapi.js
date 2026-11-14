// OpenAPI (Swagger) description of every API in this project.
// swagger-ui-express turns this object into the interactive page at /api/docs.

// --- Small helpers so each endpoint below stays short -------------------------------

// A JSON body that matches one of the schemas defined in components.schemas.
const json = (schemaName) => ({
  content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } }
})

// A successful response with a JSON body.
const ok = (description, schemaName) => ({ description, ...json(schemaName) })

// An error response; every error from this API has the same { message } shape.
const error = (description) => ({ description, ...json('Error') })

// Marks an endpoint as "needs login" (the cafe_session cookie).
const loginRequired = [{ sessionCookie: [] }]

// --- The document --------------------------------------------------------------------

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Cafe Aramesh API',
    version: '1.0.0',
    description:
      'API سامانهٔ رزرو میز کافه آرامش. برای APIهایی که قفل دارند، اول از /auth/login وارد شوید؛ ' +
      'مرورگر کوکی نشست را خودش نگه می‌دارد و با درخواست‌های بعدی می‌فرستد.'
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth', description: 'ثبت‌نام، ورود، خروج و بازیابی رمز' },
    { name: 'Tables', description: 'میزها و قفل موقت ۵ دقیقه‌ای' },
    { name: 'Reservations', description: 'ثبت و مشاهدهٔ رزرو' },
    { name: 'Menu', description: 'منوی کافه' },
    { name: 'Health', description: 'وضعیت سرور' }
  ],

  paths: {
    // ----- Auth -----
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'ثبت‌نام و ورود خودکار',
        requestBody: { required: true, ...json('SignupInput') },
        responses: {
          201: ok('حساب ساخته شد و کوکی نشست ۷ روزه تنظیم شد.', 'AuthResponse'),
          400: error('ورودی نامعتبر (مثلاً ایمیل غلط یا رمز کوتاه).'),
          409: error('ایمیل یا نام کاربری تکراری است.'),
          429: error('تلاش بیش از حد؛ ۲۰ بار در هر ۱۵ دقیقه.')
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'نام قدیمی signup (همان رفتار)',
        deprecated: true,
        requestBody: { required: true, ...json('SignupInput') },
        responses: {
          201: ok('حساب ساخته شد.', 'AuthResponse'),
          400: error('ورودی نامعتبر.'),
          409: error('ایمیل یا نام کاربری تکراری است.')
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'ورود با نام کاربری یا ایمیل',
        requestBody: { required: true, ...json('LoginInput') },
        responses: {
          200: ok('ورود موفق؛ کوکی نشست ۷ روزه تنظیم شد.', 'AuthResponse'),
          400: error('ورودی نامعتبر.'),
          401: error('نام کاربری، ایمیل یا رمز عبور اشتباه است.'),
          429: error('تلاش بیش از حد؛ ۲۰ بار در هر ۱۵ دقیقه.')
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'کاربر فعلی (از روی کوکی نشست)',
        security: loginRequired,
        responses: {
          200: ok('اطلاعات کاربر واردشده.', 'AuthResponse'),
          401: error('وارد نشده‌اید یا نشست منقضی شده است.')
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'خروج و حذف نشست',
        responses: { 204: { description: 'خارج شدید؛ کوکی پاک شد.' } }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'درخواست لینک بازیابی رمز',
        description:
          'پاسخ برای ایمیل موجود و ناموجود یکسان است تا معلوم نشود چه ایمیل‌هایی حساب دارند. ' +
          'در حالت توسعه، ایمیل در پوشهٔ server/.local-mail ذخیره می‌شود.',
        requestBody: { required: true, ...json('ForgotPasswordInput') },
        responses: {
          202: ok('درخواست پذیرفته شد.', 'MessageResponse'),
          400: error('ایمیل نامعتبر.'),
          429: error('درخواست بیش از حد؛ ۱۰ بار در هر ۱۵ دقیقه.'),
          503: error('سرویس ایمیل روی سرور تنظیم نشده است.')
        }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'ثبت رمز جدید با توکن لینک بازیابی',
        description:
          'توکن یک‌بارمصرف است و ۱۵ دقیقه اعتبار دارد. بعد از تغییر رمز، همهٔ نشست‌ها باطل می‌شوند.',
        requestBody: { required: true, ...json('ResetPasswordInput') },
        responses: {
          200: ok('رمز عوض شد.', 'MessageResponse'),
          400: error('لینک نامعتبر یا منقضی شده، یا رمز کوتاه است.')
        }
      }
    },

    // ----- Health & Menu -----
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'وضعیت سرور و دیتابیس',
        responses: {
          200: ok('سرور و دیتابیس سالم‌اند.', 'HealthResponse'),
          503: ok('دیتابیس در دسترس نیست.', 'HealthResponse')
        }
      }
    },
    '/menu': {
      get: {
        tags: ['Menu'],
        summary: 'منو و ساعت‌های مجاز رزرو',
        responses: { 200: ok('فهرست آیتم‌های موجود.', 'MenuResponse') }
      }
    },

    // ----- Tables -----
    '/tables': {
      get: {
        tags: ['Tables'],
        summary: 'فهرست میزها',
        parameters: [
          {
            name: 'capacity',
            in: 'query',
            required: false,
            description: 'فقط میزهای این ظرفیت',
            schema: { type: 'integer', enum: [2, 4, 6] }
          }
        ],
        responses: {
          200: ok('فهرست میزها.', 'TablesResponse'),
          400: error('ظرفیت نامعتبر.')
        }
      }
    },
    '/tables/{id}/lock': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }
      ],
      post: {
        tags: ['Tables'],
        summary: 'قفل موقت ۵ دقیقه‌ای میز برای کاربر فعلی',
        security: loginRequired,
        responses: {
          200: ok('میز قفل شد.', 'LockResponse'),
          400: error('شناسهٔ میز نامعتبر.'),
          401: error('وارد نشده‌اید.'),
          409: error('میز رزرو شده یا دست کس دیگری است.')
        }
      },
      delete: {
        tags: ['Tables'],
        summary: 'آزاد کردن قفل میز',
        security: loginRequired,
        responses: {
          204: { description: 'قفل آزاد شد (اگر مال شما بود).' },
          401: error('وارد نشده‌اید.')
        }
      }
    },

    // ----- Reservations -----
    '/reservations': {
      post: {
        tags: ['Reservations'],
        summary: 'ثبت رزرو (اول باید میز را قفل کرده باشید)',
        description: 'قیمت‌ها فقط در سرور و از دیتابیس محاسبه می‌شوند.',
        security: loginRequired,
        requestBody: { required: true, ...json('CreateReservationInput') },
        responses: {
          201: ok('رزرو ثبت شد.', 'ReservationResponse'),
          200: ok('همین رزرو قبلاً ثبت شده بود (درخواست تکراری).', 'ReservationResponse'),
          400: error('ورودی نامعتبر یا آیتم پذیرایی ناموجود.'),
          401: error('وارد نشده‌اید.'),
          404: error('میز پیدا نشد.'),
          409: error('قفل موقت تمام شده یا میز در دسترس نیست.')
        }
      },
      get: {
        tags: ['Reservations'],
        summary: 'رزروهای من',
        security: loginRequired,
        responses: {
          200: ok('فهرست رزروهای کاربر فعلی.', 'ReservationsResponse'),
          401: error('وارد نشده‌اید.')
        }
      }
    },
    '/reservations/{bookingId}': {
      get: {
        tags: ['Reservations'],
        summary: 'رسید یک رزرو',
        security: loginRequired,
        parameters: [
          {
            name: 'bookingId',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'CAFE-0123456789ABCDEF01234567' }
          }
        ],
        responses: {
          200: ok('جزئیات رزرو.', 'ReservationResponse'),
          400: error('شناسهٔ رزرو نامعتبر.'),
          401: error('وارد نشده‌اید.'),
          404: error('رزرو پیدا نشد یا مال شما نیست.')
        }
      }
    }
  },

  components: {
    // The session lives in an HttpOnly cookie that the browser sends automatically.
    securitySchemes: {
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 'cafe_session' }
    },
    schemas: {
      // ----- Inputs (what the DTOs accept) -----
      SignupInput: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 30, example: 'test_user' },
          email: { type: 'string', format: 'email', maxLength: 254, example: 'test@example.com' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: '12345678' }
        }
      },
      LoginInput: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: { type: 'string', description: 'نام کاربری یا ایمیل', example: 'test_user' },
          password: { type: 'string', minLength: 8, maxLength: 128, example: '12345678' }
        }
      },
      ForgotPasswordInput: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', example: 'test@example.com' } }
      },
      ResetPasswordInput: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', pattern: '^[a-f0-9]{64}$', description: 'توکن داخل لینک ایمیل' },
          password: { type: 'string', minLength: 8, maxLength: 128 }
        }
      },
      CreateReservationInput: {
        type: 'object',
        required: ['tableId', 'customerName', 'bookingTime'],
        properties: {
          tableId: { type: 'integer', minimum: 1, example: 1 },
          customerName: { type: 'string', minLength: 3, maxLength: 60, example: 'مریم احمدی' },
          bookingTime: { type: 'string', enum: ['18:00', '19:00', '20:00', '21:00', '22:00'] },
          addons: {
            type: 'array',
            maxItems: 20,
            items: {
              type: 'object',
              required: ['id', 'quantity'],
              properties: {
                id: { type: 'integer', example: 1 },
                quantity: { type: 'integer', minimum: 1, maximum: 20, example: 2 }
              }
            }
          }
        }
      },

      // ----- Outputs (what toResponse returns) -----
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          username: { type: 'string', nullable: true },
          email: { type: 'string' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: { user: { $ref: '#/components/schemas/User' } }
      },
      MessageResponse: {
        type: 'object',
        properties: { message: { type: 'string' } }
      },
      Error: {
        type: 'object',
        properties: { message: { type: 'string', example: 'ایمیل معتبر وارد کنید.' } }
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'unavailable'] },
          database: { type: 'string', enum: ['connected', 'disconnected'] }
        }
      },
      MenuItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          price: { type: 'integer', description: 'تومان' },
          category: { type: 'string' },
          description: { type: 'string' },
          icon: { type: 'string' },
          isAddon: { type: 'boolean', description: 'قابل افزودن به رزرو' },
          available: { type: 'boolean' }
        }
      },
      MenuResponse: {
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } },
          timeOptions: { type: 'array', items: { type: 'string' } }
        }
      },
      Table: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          capacity: { type: 'integer' },
          price: { type: 'integer', description: 'تومان' },
          isReserved: { type: 'boolean' },
          isLocked: { type: 'boolean' }
        }
      },
      TablesResponse: {
        type: 'object',
        properties: { tables: { type: 'array', items: { $ref: '#/components/schemas/Table' } } }
      },
      LockResponse: {
        type: 'object',
        properties: {
          table: { $ref: '#/components/schemas/Table' },
          expiresAt: { type: 'string', format: 'date-time' }
        }
      },
      Reservation: {
        type: 'object',
        properties: {
          bookingId: { type: 'string' },
          tableId: { type: 'integer' },
          tableTitle: { type: 'string' },
          capacity: { type: 'integer' },
          customerName: { type: 'string' },
          bookingTime: { type: 'string' },
          addons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                title: { type: 'string' },
                price: { type: 'integer' },
                quantity: { type: 'integer' }
              }
            }
          },
          tablePrice: { type: 'integer' },
          totalPrice: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ReservationResponse: {
        type: 'object',
        properties: { reservation: { $ref: '#/components/schemas/Reservation' } }
      },
      ReservationsResponse: {
        type: 'object',
        properties: {
          reservations: { type: 'array', items: { $ref: '#/components/schemas/Reservation' } }
        }
      }
    }
  }
}
