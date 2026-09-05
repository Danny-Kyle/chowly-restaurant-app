'use client'

import { useState } from 'react'
import RoleToggle from '@/components/RoleToggle'
import CustomerView from '@/components/customer/CustomerView'
import WaiterView from '@/components/waiter/WaiterView'

type Role = 'customer' | 'waiter'

export default function Home() {
  // Plain React state, not a route or localStorage — refreshing the page
  // always drops back to the Customer view, by design.
  const [role, setRole] = useState<Role>('customer')

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <span className="font-display text-lg">Chowly</span>
        <RoleToggle role={role} onChange={setRole} />
      </header>
      <div className="flex-1">{role === 'customer' ? <CustomerView /> : <WaiterView />}</div>
    </main>
  )
}
