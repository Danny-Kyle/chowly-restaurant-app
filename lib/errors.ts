import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Something went wrong'
}
export function apiError(error: unknown) {
  if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status })
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  const status = code === 'P0002' || code === 'PGRST116' ? 404
    : code === 'P0001' || code === '23505' ? 409
    : ['22023', '22P02', '22003', '23503', '23514'].includes(code) ? 400 : 500
  if (status === 500) console.error('Chowly request failed', error)
  return NextResponse.json({ error: status === 500 ? 'The restaurant service is unavailable. Please try again.' : getErrorMessage(error) }, { status })
}
