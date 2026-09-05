'use client'

import { useState } from 'react'

export default function ComplaintRatingForm({
  orderId,
  customerId,
}: {
  orderId: string
  customerId: string
}) {
  const [open, setOpen] = useState(false)
  const [complaintType, setComplaintType] = useState('Delay')
  const [description, setDescription] = useState('')
  const [ratingScore, setRatingScore] = useState(3)
  const [comments, setComments] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const [complaintRes, ratingRes] = await Promise.all([
        fetch(`/api/orders/${orderId}/complaint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId, complaintType, description }),
        }),
        fetch(`/api/orders/${orderId}/rating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ratingScore, comments }),
        }),
      ])
      if (!complaintRes.ok) throw new Error((await complaintRes.json()).error)
      if (!ratingRes.ok) throw new Error((await ratingRes.json()).error)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return <p className="text-sm text-ink-soft">Thanks — your complaint and rating were recorded.</p>
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-alert underline underline-offset-2">
        Order delayed? File a complaint & rating
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="ticket px-4 py-4 space-y-3">
      <h3 className="font-display text-lg">Report a delay</h3>
      <div>
        <label className="block text-sm mb-1">What went wrong?</label>
        <select
          value={complaintType}
          onChange={(e) => setComplaintType(e.target.value)}
          className="w-full border border-line bg-paper-raised rounded-sm px-3 py-2"
        >
          <option>Delay</option>
          <option>Quality</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Tell us more</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-line bg-paper-raised rounded-sm px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Rating ({ratingScore}/5)</label>
        <input
          type="range"
          min={1}
          max={5}
          value={ratingScore}
          onChange={(e) => setRatingScore(Number(e.target.value))}
          className="w-full accent-[color:var(--color-alert)]"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Any other comments</label>
        <input
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full border border-line bg-paper-raised rounded-sm px-3 py-2"
        />
      </div>
      {error && <p className="text-alert text-sm">{error}</p>}
      <button
        disabled={loading}
        className="w-full bg-alert text-paper-raised rounded-sm py-2.5 font-medium disabled:opacity-60"
      >
        {loading ? 'Submitting…' : 'Submit complaint & rating'}
      </button>
    </form>
  )
}
