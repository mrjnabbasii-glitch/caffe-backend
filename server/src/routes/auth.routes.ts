import { createHash, randomBytes } from 'node:crypto'
import { Router } from 'express'
import type { CookieOptions, NextFunction, Request, Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import { Transform } from 'class-transformer'
import { IsString, Length, Matches } from 'class-validator'
import type { Types } from 'mongoose'
import { CredentialsDto } from '../dto/shared/credentials.dto.js'
import { EmailValueDto, emailInput } from '../dto/shared/email.dto.js'
import { PasswordValueDto } from '../dto/shared/password.dto.js'
import { publicUser } from '../dto/shared/user.dto.js'
import { usernameInput } from '../dto/shared/username.dto.js'
import { lowerText, trimText, usernameText, validateDto } from '../dto/shared/validation.js'
import type { AuthResponse, UserSource } from '../dto/shared/contracts.js'
import { Session } from '../models/session.model.js'
import { User } from '../models/user.model.js'
import {
  assertMailConfigured,
  resetOrigin,
  sendPasswordResetEmail
} from '../services/mail/password-reset-mail.service.js'
import { fail } from '../utils/http-error.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

const COOKIE_NAME = 'cafe_session'
export const SESSION_MS = 7 * 24 * 60 * 60 * 1000
const FIFTEEN_MINUTES = 15 * 60 * 1000
const INVALID_LINK = 'لینک بازیابی نامعتبر یا منقضی شده است.'

type SendResetEmail = (message: { to: string; url: string; expiresAt: Date }) => Promise<void>
type AuthenticatedRequest = Request & { user?: UserSource; ownerHash?: string }

// Request validation and public responses.
class SignupRequestDto extends CredentialsDto {
  @Transform(usernameText)
  @IsString({ message: 'نام کاربری باید متن باشد.' })
  @Matches(/^\p{L}[\p{L}\p{N}_]{2,29}$/u, {
    message: 'نام کاربری باید ۳ تا ۳۰ حرف، عدد یا زیرخط باشد و با حرف شروع شود.'
  })
  username!: string
}
function parseSignup(req: Request): SignupRequestDto {
  return validateDto(SignupRequestDto, req.body)
}

class LoginRequestDto {
  @Transform(lowerText)
  @IsString({ message: 'نام کاربری یا ایمیل باید متن باشد.' })
  @Length(3, 254, { message: 'نام کاربری یا ایمیل معتبر وارد کنید.' })
  identifier!: string
  @IsString({ message: 'رمز عبور باید متن باشد.' })
  @Length(8, 128, { message: 'رمز عبور باید بین ۸ تا ۱۲۸ نویسه باشد.' })
  password!: string
}
interface LoginInput {
  email?: string
  username?: string
  password: string
}
function parseLogin(req: Request): LoginInput {
  const input = validateDto(LoginRequestDto, {
    identifier: req.body?.identifier !== undefined ? req.body.identifier : req.body?.email,
    password: req.body?.password
  })
  return {
    ...(input.identifier.includes('@')
      ? { email: emailInput(input.identifier) }
      : { username: usernameInput(input.identifier) }),
    password: input.password
  }
}

class ForgotPasswordRequestDto extends EmailValueDto {}
function parseForgotPassword(req: Request): ForgotPasswordRequestDto {
  return validateDto(ForgotPasswordRequestDto, req.body)
}
function forgotPasswordResponse(): { message: string } {
  return {
    message: 'اگر حسابی با این ایمیل وجود داشته باشد، راهنمای بازیابی رمز برای آن ارسال می‌شود.'
  }
}

class ResetPasswordRequestDto extends PasswordValueDto {
  @Transform(trimText)
  @IsString({ message: 'لینک بازیابی نامعتبر است.' })
  @Matches(/^[a-f0-9]{64}$/, { message: 'لینک بازیابی نامعتبر یا منقضی شده است.' })
  token!: string
}
function parseResetPassword(req: Request): ResetPasswordRequestDto {
  return validateDto(ResetPasswordRequestDto, req.body)
}
function resetPasswordResponse(): { message: string } {
  return { message: 'رمز عبور تغییر کرد. با رمز جدید وارد شوید.' }
}

function authResponse(user: UserSource): AuthResponse {
  return { user: publicUser(user) }
}

// Session cookies, persistence, and middleware for protected routes.
// A function (not a constant) so NODE_ENV is read at request time, not at import time.
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api'
})

function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_MS })
}
function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, cookieOptions())
}

// Only the SHA-256 hash of a token is stored, so a database leak does not leak live sessions.
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

// Creates a new random session token. If the browser already had one, it is replaced
// (session rotation), so an old token can never be reused after login.
export async function createSession(
  userId: Types.ObjectId,
  previousToken?: string,
  passwordVersion = 0
) {
  const token = randomBytes(32).toString('hex')
  await Session.create({
    tokenHash: hashToken(token),
    userId,
    passwordVersion,
    expiresAt: new Date(Date.now() + SESSION_MS)
  })
  if (previousToken) await revokeSession(previousToken)
  return token
}

async function revokeSession(token?: string) {
  if (token) await Session.deleteOne({ tokenHash: hashToken(token) })
}

// Reads our cookie from the raw "Cookie: a=1; cafe_session=..." header.
function readToken(req: Request) {
  return req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(COOKIE_NAME + '='))
    ?.slice(COOKIE_NAME.length + 1)
}

// Guards private routes: valid cookie -> live session -> existing user, else 401.
// On success it puts the user on req.user for the controllers.
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = readToken(req)
  if (!token || !/^[a-f0-9]{64}$/.test(token)) fail(401, 'برای ادامه وارد حساب خود شوید.')
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() }
  }).lean()
  const user = session && (await User.findById(session.userId).lean())
  // A password change bumps passwordVersion, which invalidates every older session.
  if (!user || (session.passwordVersion ?? 0) !== (user.passwordVersion ?? 0)) {
    clearSessionCookie(res)
    fail(401, 'نشست شما منقضی شده است؛ دوباره وارد شوید.')
  }
  req.user = user
  // Reservations store a hash of the account id as their owner (kept for existing data).
  req.ownerHash = hashToken(user._id.toString())
  next()
}

// Account registration, login, and password recovery.
async function register({ username, email, password }: SignupRequestDto) {
  if (await User.exists({ email })) fail(409, 'این ایمیل قبلاً ثبت شده است.')
  if (await User.exists({ username })) fail(409, 'این نام کاربری قبلاً انتخاب شده است.')
  return User.create({
    name: username,
    username,
    email,
    passwordHash: await hashPassword(password)
  })
}

const dummyHash = hashPassword('dummy-password-for-timing')
async function login({ email, username, password }: LoginInput) {
  const user = await User.findOne(email ? { email } : { username }).select('+passwordHash')
  const valid = await verifyPassword(password, user?.passwordHash || (await dummyHash))
  if (!user || !valid) fail(401, 'نام کاربری، ایمیل یا رمز عبور اشتباه است.')
  return user
}

async function requestPasswordReset(
  { email }: ForgotPasswordRequestDto,
  sendResetEmail?: SendResetEmail
) {
  if (!sendResetEmail) assertMailConfigured()
  const origin = resetOrigin()
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + FIFTEEN_MINUTES)
  // A one-minute cooldown prevents mailbox flooding and leaves the latest link usable.
  const user = await User.findOneAndUpdate(
    {
      email,
      $or: [
        { resetRequestedAt: { $exists: false } },
        { resetRequestedAt: { $lte: new Date(now.getTime() - 60000) } }
      ]
    },
    { $set: { resetTokenHash: tokenHash, resetExpiresAt: expiresAt, resetRequestedAt: now } },
    { returnDocument: 'after' }
  ).lean()
  if (!user) return
  try {
    await (sendResetEmail || sendPasswordResetEmail)({
      to: user.email,
      url: origin + '/reset-password#token=' + token,
      expiresAt
    })
  } catch (error) {
    await User.updateOne(
      { _id: user._id, resetTokenHash: tokenHash },
      { $unset: { resetTokenHash: 1, resetExpiresAt: 1, resetRequestedAt: 1 } }
    )
    // Do not disclose whether the email exists, credentials, or the reset link.
    const mailError = error as { code?: string; name?: string } | undefined
    console.error('Password-recovery delivery failed:', mailError?.code || mailError?.name)
  }
}

async function resetPassword({ token, password }: ResetPasswordRequestDto) {
  const validToken = { resetTokenHash: hashToken(token), resetExpiresAt: { $gt: new Date() } }
  // Cheap check first, so invalid links do not cost a slow scrypt hash.
  if (!(await User.exists(validToken))) fail(400, INVALID_LINK)

  const passwordHash = await hashPassword(password)
  // One atomic update both consumes the token and changes the password,
  // so two parallel requests with the same link cannot both succeed.
  const user = await User.findOneAndUpdate(
    validToken,
    {
      $set: { passwordHash },
      $inc: { passwordVersion: 1 },
      $unset: { resetTokenHash: 1, resetExpiresAt: 1, resetRequestedAt: 1 }
    },
    { returnDocument: 'after' }
  ).lean()
  if (!user) fail(400, INVALID_LINK)

  // Log out every device that signed in with the old password.
  await Session.deleteMany({
    userId: user._id,
    $or: [
      { passwordVersion: { $lt: user.passwordVersion } },
      { passwordVersion: { $exists: false } }
    ]
  })
}

// HTTP handlers and route registration.
async function signupHandler(req: Request, res: Response) {
  const user = await register(parseSignup(req))
  const token = await createSession(user._id, readToken(req), user.passwordVersion ?? 0)
  setSessionCookie(res, token)
  res.status(201).json(authResponse(user))
}

async function loginHandler(req: Request, res: Response) {
  const user = await login(parseLogin(req))
  const token = await createSession(user._id, readToken(req), user.passwordVersion ?? 0)
  setSessionCookie(res, token)
  res.status(200).json(authResponse(user))
}

function meHandler(req: AuthenticatedRequest, res: Response) {
  // requireAuth has already loaded the user.
  res.json(authResponse(req.user!))
}

async function logoutHandler(req: Request, res: Response) {
  await revokeSession(readToken(req))
  clearSessionCookie(res)
  res.status(204).end()
}

async function resetPasswordHandler(req: Request, res: Response) {
  await resetPassword(parseResetPassword(req))
  clearSessionCookie(res)
  res.json(resetPasswordResponse())
}

// Brute-force protection: each IP gets a limited number of attempts per window.
function createLimiter(limit: number, message: string) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message }
  })
}

export function createAuthRouter({ sendResetEmail }: { sendResetEmail?: SendResetEmail } = {}) {
  const router = Router()
  const loginLimiter = createLimiter(20, 'تلاش‌های زیادی انجام شده؛ چند دقیقه صبر کنید.')
  const recoveryLimiter = createLimiter(
    10,
    'درخواست‌های بازیابی زیادی ارسال شده؛ چند دقیقه صبر کنید.'
  )

  router.post(['/signup', '/register'], loginLimiter, signupHandler)
  router.post('/login', loginLimiter, loginHandler)
  router.get('/me', requireAuth, meHandler)
  router.post('/logout', logoutHandler)
  router.post('/forgot-password', recoveryLimiter, async (req, res) => {
    await requestPasswordReset(parseForgotPassword(req), sendResetEmail)
    res.status(202).json(forgotPasswordResponse())
  })
  router.post('/reset-password', recoveryLimiter, resetPasswordHandler)
  return router
}
