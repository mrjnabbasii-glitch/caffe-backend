// Throws an error that carries an HTTP status; error-handler.js turns it into the response.
// Example: fail(404, 'میز پیدا نشد.')
/** @returns {never} */
export function fail(status, message) {
  throw Object.assign(new Error(message), { status })
}
