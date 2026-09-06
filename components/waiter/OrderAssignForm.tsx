'use client'

import { useEffect, useState } from 'react'
import type { Order, OrderItem, Staff } from '@/lib/types'
import { formatNaira } from '@/lib/format'
import CancelOrderButton from '../CancelOrderButton'

export default function OrderAssignForm({
  orderId,
  onBack,
  onResolved,
}: {
  orderId: string
  onBack: () => void
  onResolved: () => void
}) {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [chefs, setChefs] = useState<Staff[]>([])
  const [bartenders, setBartenders] = useState<Staff[]>([])
  const [error, setError] = useState('')
  const [serving, setServing] = useState(false)

  async function load() {
    const [orderRes, staffRes] = await Promise.all([
      fetch(`/api/orders/${orderId}`).then((r) => r.json()),
      fetch('/api/staff').then((r) => r.json()),
    ])
    setOrder(orderRes.order)
    setItems(orderRes.items)
    setChefs(staffRes.chefs)
    setBartenders(staffRes.bartenders)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  async function handleAssign(item: OrderItem, staffId: string) {
    setError('')
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign',
        orderItemId: item.order_item_id,
        category: item.menu_items?.category,
        staffId,
      }),
    })
    if (!res.ok) {
      setError((await res.json()).error)
      return
    }
    load()
  }

  async function handleServe() {
    setServing(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'serve' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onResolved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setServing(false)
    }
  }

  if (!order) return <p className="text-ink-soft">Loading order…</p>

  return (
    <div>
      <button onClick={onBack} className="text-sm text-ink-soft underline underline-offset-2 mb-4">
        ← Back to queue
      </button>
      <h2 className="font-display text-xl mb-1">Order {order.order_id}</h2>
      <p className="text-ink-soft text-sm mb-4">
        {order.customers?.first_name} {order.customers?.last_name} · {formatNaira(order.total_order_amount)}
      </p>

      <div className="space-y-3 mb-4">
        {items.map((item) => {
          const isDrink = item.menu_items?.category === 'drink'
          const options = isDrink ? bartenders : chefs
          const currentStaffId = item.chef_id || item.bartender_id || ''
          const idKey = isDrink ? 'bartender_id' : 'chef_id'

          return (
            <div key={item.order_item_id} className="ticket px-4 py-3">
              <p className="font-medium">
                {item.quantity} × {item.menu_items?.item_name}
                <span className="text-xs text-ink-soft ml-2 font-data uppercase">
                  {isDrink ? 'bar' : 'kitchen'}
                </span>
              </p>
              <select
                value={currentStaffId}
                onChange={(e) => handleAssign(item, e.target.value)}
                disabled={order.status !== 'Pending'}
                className="mt-2 w-full border border-line bg-paper-raised rounded-sm px-3 py-2 disabled:opacity-60"
              >
                <option value="">Assign {isDrink ? 'bartender' : 'chef'}…</option>
                {options.map((s) => (
                  <option key={(s as Record<string, string>)[idKey]} value={(s as Record<string, string>)[idKey]}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {error && <p className="text-alert text-sm mb-2">{error}</p>}

      {order.status === 'Cancelled' ? (
        <div className="ticket px-4 py-3 text-center text-alert font-medium">
          Cancelled{order.cancelled_by ? ` by the ${order.cancelled_by}` : ''}
        </div>
      ) : order.status === 'Served' ? (
        <div className="ticket px-4 py-3 text-center text-accent font-medium">Served</div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleServe}
            disabled={serving}
            className="w-full bg-accent text-paper-raised rounded-sm py-2.5 font-medium disabled:opacity-60"
          >
            {serving ? 'Marking served…' : 'Mark as served'}
          </button>
          <div className="text-center">
            <CancelOrderButton orderId={order.order_id} cancelledBy="waiter" onCancelled={onResolved} />
          </div>
        </div>
      )}
    </div>
  )
}
