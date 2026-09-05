'use client'

import { useState } from 'react'
import { formatNaira } from '@/lib/format'

export default function PaymentButton({
  orderId,
  amount,
  isPaid,
  onPaid,
}: {
  orderId: string
  amount: number
  isPaid: boolean
  onPaid: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onPaid()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (isPaid) {
    return (
      <div className="ticket px-4 py-3 text-center text-accent font-medium">Paid — see you again soon</div>
    )
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-ink text-paper-raised rounded-sm py-2.5 font-medium disabled:opacity-60"
      >
        {loading ? 'Processing…' : `Pay ${formatNaira(amount)} (Pretend Payment)`}
      </button>
      <p className="text-xs text-ink-soft mt-1 text-center">
        This is a pretend payment for demo purposes — no real money is charged.
      </p>
      {error && <p className="text-alert text-sm mt-1">{error}</p>}
    </div>
  )
}
