// Single-restaurant, no-login build — these stand in for "session" data.
export const RESTAURANT_ID = 'RES001'
export const DEFAULT_WAITER_ID = 'WAI001' // whoever is using the Waiter view

export const ORDER_STATUS = {
  PENDING: 'Pending',
  SERVED: 'Served',
  CANCELLED: 'Cancelled',
} as const

// Simulated delivery timeline shown to the customer after the waiter marks an
// order served. Each stage lasts this long; two stages = 2 minutes total
// before the customer actually sees "Served".
export const DELIVERY_STAGE_MS = 60 * 1000

export const COMPLAINT_STATUS = {
  OPEN: 'Open',
} as const
