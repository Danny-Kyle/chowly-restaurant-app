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
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/orders')
      .then(async (r) => { const data = await r.json(); if (!r.ok) throw new Error(data.error); return data })
      .then((data) => { setOrders(data.orders); setError('') })
      .catch((error) => setError(error instanceof Error ? error.message : 'Could not load data'))
      .finally(() => setLoading(false))
  }, [refreshKey])

  if (error) return <p role="alert" className="text-alert">{error}</p>

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
              <p className="font-data text-sm break-all">{order.order_id}</p>
              <p className="text-ink-soft text-sm">
                {order.customers?.first_name} {order.customers?.last_name}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="font-data">{formatNaira(order.total_order_amount)}</p>
              <span
                className={`text-xs uppercase font-data px-2 py-0.5 rounded-sm ${
                  order.status === 'Served'
                    ? 'bg-accent-soft text-accent'
                    : order.status === 'Cancelled'
                      ? 'bg-alert-soft text-alert'
                      : 'bg-line/40'
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
