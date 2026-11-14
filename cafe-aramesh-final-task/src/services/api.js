import axios from 'axios'

// Relative '/api': in development Vite proxies it to the backend, in production the backend
// serves this page itself. withCredentials lets the browser send the HttpOnly session cookie.
const client = axios.create({ baseURL: '/api', timeout: 12000, withCredentials: true })

// The single place that talks to the server. Always returns response data or throws an
// Error with a Persian message that components can show directly.
export async function request(method, url, data) {
  try {
    const response = await client.request({ method, url, data })
    return response.data
  } catch (error) {
    const status = error.response?.status
    // Session expired on a normal request: tell main.js to log out and redirect to login.
    if (status === 401 && !url.startsWith('/auth/'))
      window.dispatchEvent(new Event('cafe:unauthorized'))
    throw Object.assign(
      new Error(
        error.response?.data?.message ||
          'ارتباط با سرور برقرار نشد. اتصال و اجرای بک‌اند را بررسی کنید.'
      ),
      { status }
    )
  }
}
