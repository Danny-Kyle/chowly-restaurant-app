'use client'

import { useEffect, useState } from 'react'
import type { Order, OrderItem } from '@/lib/types'
import { formatNaira, formatMinutes } from '@/lib/format'

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (!cancelled) {
        setOrder(data.order)
        setItems(data.items)
      }
    }

    load()
    const interval = setInterval(load, 5000) // pick up waiter updates without a manual refresh
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orderId])

  if (!order) return <p className="text-ink-soft">Loading order…</p>

  return (
    <div className="ticket px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-lg">Order {order.order_id}</h3>
        <span
          className={`font-data text-xs uppercase px-2 py-1 rounded-sm ${
            order.status === 'Served' ? 'bg-accent-soft text-accent' : 'bg-line/40'
          }`}
        >
          {order.status}
        </span>
      </div>
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
