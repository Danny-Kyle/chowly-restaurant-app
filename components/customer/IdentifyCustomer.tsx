'use client'

import { useState } from 'react'
import type { Customer } from '@/lib/types'

export default function IdentifyCustomer({ onIdentified }: { onIdentified: (c: Customer) => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onIdentified(data.customer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-6">
      <h1 className="font-display text-3xl mb-1">Welcome to The Bear</h1>
      <p className="text-ink-soft mb-8">Tell us your name to start an order at your table.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">First name</label>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border border-line bg-paper-raised rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Daniel"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-line bg-paper-raised rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Okechukwu"
          />
        </div>
        {error && <p className="text-alert text-sm">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-accent text-paper-raised rounded-sm py-2.5 font-medium disabled:opacity-60"
        >
          {loading ? 'One moment…' : 'Start ordering'}
        </button>
      </form>
    </div>
  )
}
