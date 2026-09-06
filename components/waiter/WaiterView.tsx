'use client'

import { useState } from 'react'
import OrderQueue from './OrderQueue'
import OrderAssignForm from './OrderAssignForm'

export default function WaiterView() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="font-display text-2xl mb-6">Order queue</h1>
      {selectedOrderId ? (
        <OrderAssignForm
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
          onResolved={() => {
            setSelectedOrderId(null)
            setRefreshKey((k) => k + 1)
          }}
        />
      ) : (
        <OrderQueue onSelect={setSelectedOrderId} refreshKey={refreshKey} />
      )}
    </div>
  )
}
