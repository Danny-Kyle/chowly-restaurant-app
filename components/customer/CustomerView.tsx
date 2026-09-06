'use client'

import { useEffect, useState } from 'react'
import type { Customer, CartLine, MenuItem, Order } from '@/lib/types'
import { loadCustomerSession, saveCustomerSession, clearCustomerSession } from '@/lib/session'
import { useOrder } from '@/hooks/useOrder'
import { useNow } from '@/hooks/useNow'
import { getDeliveryStage } from '@/lib/deliveryStage'
import IdentifyCustomer from './IdentifyCustomer'
import MenuBrowser from './MenuBrowser'
import Cart from './Cart'
import OrderStatus from './OrderStatus'
import ComplaintRatingForm from './ComplaintRatingForm'
import PaymentButton from './PaymentButton'
import CancelOrderButton from '../CancelOrderButton'

export default function CustomerView() {
  // Lazy initializers read sessionStorage synchronously on first render, so
  // flipping the role toggle back to Customer (which remounts this component)
  // resumes the in-progress order instead of asking for a name again.
  const [customer, setCustomer] = useState<Customer | null>(() => loadCustomerSession().customer)
  const [cart, setCart] = useState<Record<string, CartLine>>(() => loadCustomerSession().cart)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(() => loadCustomerSession().placedOrder)

  useEffect(() => {
    saveCustomerSession({ customer, cart, placedOrder })
  }, [customer, cart, placedOrder])

  // Once an order exists, poll its live state — this is the source of truth
  // for status/served_at/is_paid, not anything cached in the session.
  const { order: liveOrder, items, refresh } = useOrder(placedOrder?.order_id || '')
  const now = useNow()
  const stage = liveOrder ? getDeliveryStage(liveOrder, now) : null

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev[item.menu_item_id]
      return { ...prev, [item.menu_item_id]: { item, quantity: (existing?.quantity || 0) + 1 } }
    })
  }

  function removeFromCart(menuItemId: string) {
    setCart((prev) => {
      const existing = prev[menuItemId]
      if (!existing) return prev
      if (existing.quantity <= 1) {
        const rest = { ...prev }
        delete rest[menuItemId]
        return rest
      }
      return { ...prev, [menuItemId]: { ...existing, quantity: existing.quantity - 1 } }
    })
  }

  function startNewOrder() {
    setCart({})
    setPlacedOrder(null)
  }

  function switchCustomer() {
    clearCustomerSession()
    setCustomer(null)
    setCart({})
    setPlacedOrder(null)
  }

  if (!customer) {
    return <IdentifyCustomer onIdentified={setCustomer} />
  }

  const tableHeader = (
    <div className="flex items-center justify-between mb-1">
      <p className="text-ink-soft text-sm">Table for {customer.first_name}</p>
      <button onClick={switchCustomer} className="text-xs text-ink-soft underline underline-offset-2">
        Not you?
      </button>
    </div>
  )

  if (placedOrder) {
    return (
      <div className="max-w-md mx-auto px-6 py-10 space-y-4">
        {tableHeader}
        {!liveOrder ? (
          <p className="text-ink-soft">Loading order…</p>
        ) : (
          <>
            <OrderStatus order={liveOrder} items={items} />

            {liveOrder.status === 'Pending' && (
              <CancelOrderButton orderId={liveOrder.order_id} cancelledBy="customer" onCancelled={refresh} />
            )}

            {liveOrder.status === 'Cancelled' ? (
              <div className="ticket px-4 py-3 text-center text-alert font-medium">
                This order was cancelled{liveOrder.cancelled_by ? ` by the ${liveOrder.cancelled_by}` : ''}.
              </div>
            ) : (
              <>
                <ComplaintRatingForm orderId={liveOrder.order_id} customerId={customer.customer_id} />
                {stage === 'Served' && (
                  <PaymentButton
                    orderId={liveOrder.order_id}
                    amount={liveOrder.total_order_amount}
                    isPaid={liveOrder.is_paid}
                    onPaid={refresh}
                  />
                )}
              </>
            )}

            {(liveOrder.status === 'Cancelled' || liveOrder.is_paid) && (
              <button onClick={startNewOrder} className="text-sm underline underline-offset-2 text-ink-soft">
                Start a new order
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10 pb-32">
      {tableHeader}
      <h1 className="font-display text-2xl mb-6">Menu</h1>
      <MenuBrowser cart={cart} onAdd={addToCart} onRemove={removeFromCart} />
      <div className="mt-6">
        <Cart
          cart={cart}
          customerId={customer.customer_id}
          onOrderPlaced={(result) => setPlacedOrder((result as { order: Order }).order)}
        />
      </div>
    </div>
  )
}
