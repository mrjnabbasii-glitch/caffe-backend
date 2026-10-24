import axios from 'axios'

const client = axios.create({ baseURL: '/api', timeout: 12000 })
const SESSION_KEY = 'cafeArameshSession'
let sessionRequest
async function sessionToken() {
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing
  if (!sessionRequest) sessionRequest = client.post('/session').then(({ data }) => {
    localStorage.setItem(SESSION_KEY, data.token)
    return data.token
  }).finally(() => { sessionRequest = null })
  return sessionRequest
}
export async function request(method, url, data) {
  try {
    const token = await sessionToken()
    const response = await client.request({ method, url, data, headers: { Authorization: `Bearer ${token}` } })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'ارتباط با سرور برقرار نشد. اتصال و اجرای بک‌اند را بررسی کنید.')
  }
}
