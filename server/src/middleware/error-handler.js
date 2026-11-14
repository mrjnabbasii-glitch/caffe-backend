const DUPLICATE_KEY = 11000 // MongoDB error code when a unique index is violated.

// Express recognises an error handler by its four parameters.
export function errorHandler(error, _req, res, _next) {
  if (error.code === DUPLICATE_KEY) {
    // Happens when two signups race past the "already exists" check in the service.
    const message = error.keyPattern?.username
      ? 'این نام کاربری قبلاً انتخاب شده است.'
      : 'این ایمیل قبلاً ثبت شده است.'
    return res.status(409).json({ message })
  }

  const status = error.status || (error.name === 'ValidationError' ? 400 : 500)
  if (status >= 500) {
    // Log the details for us, but never show internal errors to the user.
    console.error(error.name, error.message)
    return res.status(status).json({ message: 'خطای سرور؛ دوباره تلاش کنید.' })
  }
  res.status(status).json({ message: error.message })
}
