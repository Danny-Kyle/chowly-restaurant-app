import type { Customer, CartLine, Order } from './types'

const KEY = 'chowly-customer-session'

type CustomerSession = {
  customer: Customer | null
  cart: Record<string, CartLine>
  placedOrder: Order | null
  isPaid: boolean
}

const empty: CustomerSession = { customer: null, cart: {}, placedOrder: null, isPaid: false }

/**
 * This is deliberately sessionStorage, not a login: no password, nothing
 * shared across devices, cleared the moment the tab closes. It exists only
 * to survive two things that would otherwise wipe React state mid-order:
 * flipping the Customer/Waiter toggle (unmounts CustomerView) and an
 * accidental page refresh. Without it, a customer who does either loses
 * the only reference to their order and can never reach payment or file
 * a complaint on it.
 */
export function loadCustomerSession(): CustomerSession {
  if (typeof window === 'undefined') return empty
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

export function saveCustomerSession(session: CustomerSession) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify(session))
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(KEY)
}
