import { DELIVERY_STAGE_MS } from './constants'

export type DeliveryStage = 'Preparing' | 'Delivering' | 'Served' | 'Cancelled'

type OrderTiming = { status: string; served_at: string | null }

/**
 * The database status flips to 'Served' the instant the waiter marks it —
 * that's the real event. What the customer *sees* is a simulated timeline
 * layered on top: Preparing -> Delivering -> Served, spread over the two
 * minutes after served_at, so the experience feels like an actual delivery
 * rather than an instant flip.
 */
export function getDeliveryStage(order: OrderTiming, nowMs: number): DeliveryStage {
  if (order.status === 'Cancelled') return 'Cancelled'
  if (order.status !== 'Served' || !order.served_at) return 'Preparing'

  const elapsed = nowMs - new Date(order.served_at).getTime()
  if (elapsed < DELIVERY_STAGE_MS) return 'Preparing'
  if (elapsed < DELIVERY_STAGE_MS * 2) return 'Delivering'
  return 'Served'
}

/** Seconds left until the displayed stage reaches "Served", or 0 if it already has. */
export function secondsUntilServedDisplay(order: OrderTiming, nowMs: number): number {
  if (order.status !== 'Served' || !order.served_at) return 0
  const elapsed = nowMs - new Date(order.served_at).getTime()
  const remaining = DELIVERY_STAGE_MS * 2 - elapsed
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}
