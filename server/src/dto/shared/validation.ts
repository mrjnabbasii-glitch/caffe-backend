import 'reflect-metadata'
import { plainToInstance, type ClassConstructor, type TransformFnParams } from 'class-transformer'
import { validateSync, type ValidationError } from 'class-validator'

function messages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...messages(error.children ?? [])
  ])
}
export function validateDto<T extends object>(Dto: ClassConstructor<T>, input: unknown): T {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw Object.assign(new Error('ساختار ورودی نامعتبر است.'), { status: 400 })
  const instance = plainToInstance(Dto, input, { enableImplicitConversion: false })
  const errors = validateSync(instance, {
    whitelist: true,
    forbidUnknownValues: true,
    validationError: { target: false, value: false }
  })
  if (errors.length)
    throw Object.assign(new Error(messages(errors)[0] || 'ورودی نامعتبر است.'), { status: 400 })
  return instance
}
export function trimText({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value
}
export function lowerText({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value
}
export function usernameText({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.normalize('NFKC').trim().toLowerCase() : value
}
export function tableIdNumber({ value }: TransformFnParams): unknown {
  if (typeof value === 'string' && /^[1-9]\d{0,5}$/.test(value.trim())) return Number(value.trim())
  return value
}
