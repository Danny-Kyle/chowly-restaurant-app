/**
 * Supabase-js throws plain objects like { message, details, hint, code } —
 * these are NOT instances of Error, so `err instanceof Error` misses them
 * and hides the real problem behind a generic message. This checks for a
 * `.message` string on anything error-shaped before giving up.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message

  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message) return message
  }

  return 'Unknown error'
}
