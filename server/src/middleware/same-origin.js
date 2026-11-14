import { fail } from '../utils/http-error.js'

// SameSite cookies plus origin checks protect state-changing cookie requests.
export function sameOrigin(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()
  const origin = req.get('origin')
  const allowed = new Set([req.protocol + '://' + req.get('host')])
  if (process.env.APP_ORIGIN) allowed.add(process.env.APP_ORIGIN)
  else if (process.env.NODE_ENV !== 'production') allowed.add('http://localhost:5173')
  if (req.get('sec-fetch-site') === 'cross-site' || (origin && !allowed.has(origin)))
    fail(403, 'مبدأ درخواست مجاز نیست.')
  next()
}
