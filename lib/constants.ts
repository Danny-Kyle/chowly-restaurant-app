// Single-restaurant, no-login build — these stand in for "session" data.
export const RESTAURANT_ID = 'RES001'
export const DEFAULT_WAITER_ID = 'WAI001' // whoever is using the Waiter view

export const ORDER_STATUS = {
  PENDING: 'Pending',
  SERVED: 'Served',
} as const

export const COMPLAINT_STATUS = {
  OPEN: 'Open',
} as const
