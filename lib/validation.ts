import { AppError } from './errors'

export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError(400, 'Expected a JSON object')
  return value as Record<string, unknown>
}
export async function readJson(request: Request) {
  try { return objectInput(await request.json()) }
  catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(400, 'Request body must be valid JSON')
  }
}
export function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new AppError(400, `${label} is required`)
  return value.trim()
}
export function optionalText(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') throw new AppError(400, `${label} must be text`)
  return value.trim() || undefined
}
export function numeric(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new AppError(400, `${label} must be a finite number`)
  return value
}
export function ratingScore(value: unknown): number {
  const score = numeric(value, 'Rating')
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new AppError(400, 'Rating must be a whole number from 1 to 5')
  return score
}
export function choice<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new AppError(400, `Invalid ${label}`)
  return value as T
}
export function cartLines(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) throw new AppError(400, 'Select at least one menu item')
  return value.map(raw => {
    const line = objectInput(raw)
    const quantity = numeric(line.quantity, 'Quantity')
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2147483647) throw new AppError(400, 'Quantity must be a positive whole number')
    return { menuItemId: text(line.menuItemId, 'Menu item'), quantity }
  })
}
