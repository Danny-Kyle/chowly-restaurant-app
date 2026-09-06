'use client'

import type { Order, OrderItem } from '@/lib/types'
import { getDeliveryStage, secondsUntilServedDisplay } from '@/lib/deliveryStage'
import { useNow } from '@/hooks/useNow'
import { formatNaira, formatMinutes } from '@/lib/format'

const STAGE_LABEL: Record<string, string> = {
  Preparing: 'Preparing your order',
  Delivering: 'On its way to your table',
  Served: 'Served',
  Cancelled: 'Cancelled',
}

export default function OrderStatus({ order, items }: { order: Order; items: OrderItem[] }) {
  const now = useNow()
  const stage = getDeliveryStage(order, now)
  const secondsLeft = secondsUntilServedDisplay(order, now)

  const badgeClass =
    stage === 'Served'
      ? 'bg-accent-soft text-accent'
      : stage === 'Cancelled'
        ? 'bg-alert-soft text-alert'
        : 'bg-line/40'

  return (
    <div className="ticket px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg">Order {order.order_id}</h3>
        <span className={`font-data text-xs uppercase px-2 py-1 rounded-sm ${badgeClass}`}>
          {STAGE_LABEL[stage]}
        </span>
      </div>

      {secondsLeft > 0 && (
        <p className="text-xs text-ink-soft mb-2">Arriving at your table in about {secondsLeft}s…</p>
      )}

      <ul className="space-y-1 mb-3 text-sm">
        {items.map((i) => (
          <li key={i.order_item_id} className="flex justify-between">
            <span>
              {i.quantity} × {i.menu_items?.item_name}
            </span>
            <span className="font-data">{formatNaira(i.subtotal)}</span>
          </li>
        ))}
      </ul>
      <div className="tear-line pt-2 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-ink-soft">Estimated wait</span>
          <span className="font-data">{formatMinutes(order.estimated_waiting_time)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span className="font-data">{formatNaira(order.total_order_amount)}</span>
        </div>
      </div>
    </div>
  )
}
