'use client'

import { useState } from 'react'
import type { CartLine } from '@/lib/types'
import { formatNaira } from '@/lib/format'

export default function Cart({
  cart,
  customerId,
  onOrderPlaced,
}: {
  cart: Record<string, CartLine>
  customerId: string
  onOrderPlaced: (result: { order: unknown; items: unknown }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lines = Object.values(cart)
  const total = lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0)

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          cart: lines.map((l) => ({ menuItemId: l.item.menu_item_id, quantity: l.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onOrderPlaced(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="ticket px-4 py-6 text-center text-ink-soft">
        Your order is empty — add something from the menu.
      </div>
    )
  }

  return (
    <div className="ticket px-4 py-4 sticky bottom-4">
      <h3 className="font-display text-lg mb-2">Your order</h3>
      <ul className="space-y-1 mb-3">
        {lines.map((l) => (
          <li key={l.item.menu_item_id} className="flex justify-between text-sm">
            <span>
              {l.quantity} × {l.item.item_name}
            </span>
            <span className="font-data">{formatNaira(l.item.price * l.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="tear-line pt-2 flex justify-between font-medium mb-3">
        <span>Total</span>
        <span className="font-data">{formatNaira(total)}</span>
      </div>
      {error && <p className="text-alert text-sm mb-2">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-accent text-paper-raised rounded-sm py-2.5 font-medium disabled:opacity-60"
      >
        {loading ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  )
}
