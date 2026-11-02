'use client'

import { useCallback, useEffect, useState } from 'react'
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

  const load = useCallback(async () => {
    try {
      const [orderRes, staffRes] = await Promise.all([
        fetch(`/api/orders/${encodeURIComponent(orderId)}`), fetch('/api/staff'),
      ])
      const [detail, staff] = await Promise.all([orderRes.json(), staffRes.json()])
      if (!orderRes.ok) throw new Error(detail.error || 'Could not load order')
      if (!staffRes.ok) throw new Error(staff.error || 'Could not load staff')
      setOrder(detail.order)
      setItems(detail.items)
      setChefs(staff.chefs)
      setBartenders(staff.bartenders)
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not load order')
    }
  }, [orderId])

  useEffect(() => { void load() }, [load])

  async function handleAssign(item: OrderItem, staffId: string) {
    setError('')
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', orderItemId: item.order_item_id, staffId }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await load()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not assign staff')
    }
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

  if (!order) return <p role={error ? 'alert' : undefined} className="text-ink-soft">{error || 'Loading order…'}</p>

  return (
    <div>
      <button onClick={onBack} className="text-sm text-ink-soft underline underline-offset-2 mb-4">
        ← Back to queue
      </button>
      <h2 className="font-display text-xl mb-1 break-all">Order {order.order_id}</h2>
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
