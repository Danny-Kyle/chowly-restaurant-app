'use client'

import { useState } from 'react'

export default function CancelOrderButton({
  orderId,
  cancelledBy,
  onCancelled,
}: {
  orderId: string
  cancelledBy: 'customer' | 'waiter'
  onCancelled: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', cancelledBy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onCancelled()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="ticket px-4 py-3">
        <p className="text-sm mb-2">Cancel this order? This can&apos;t be undone.</p>
        {error && <p className="text-alert text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-alert text-paper-raised rounded-sm py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? 'Cancelling…' : 'Yes, cancel it'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="flex-1 border border-line rounded-sm py-2 text-sm"
          >
            Never mind
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-alert underline underline-offset-2"
    >
      Cancel order
    </button>
  )
}
