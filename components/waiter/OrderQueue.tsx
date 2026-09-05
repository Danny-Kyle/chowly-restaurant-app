'use client'

import { useEffect, useState } from 'react'
import type { Order } from '@/lib/types'
import { formatNaira } from '@/lib/format'

export default function OrderQueue({
  onSelect,
  refreshKey,
}: {
  onSelect: (orderId: string) => void
  refreshKey: number
}) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.orders))
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (loading) return <p className="text-ink-soft">Loading orders…</p>
  if (orders.length === 0) return <p className="text-ink-soft">No orders yet.</p>

  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li key={order.order_id}>
          <button
            onClick={() => onSelect(order.order_id)}
            className="ticket w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <div>
              <p className="font-data text-sm">{order.order_id}</p>
              <p className="text-ink-soft text-sm">
                {order.customers?.first_name} {order.customers?.last_name}
              </p>
            </div>
            <div className="text-right">
              <p className="font-data">{formatNaira(order.total_order_amount)}</p>
              <span
                className={`text-xs uppercase font-data px-2 py-0.5 rounded-sm ${
                  order.status === 'Served' ? 'bg-accent-soft text-accent' : 'bg-line/40'
                }`}
              >
                {order.status}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
