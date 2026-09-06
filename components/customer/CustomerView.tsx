'use client'

import { useEffect, useState } from 'react'
import type { Customer, CartLine, MenuItem, Order } from '@/lib/types'
import { loadCustomerSession, saveCustomerSession, clearCustomerSession } from '@/lib/session'
import IdentifyCustomer from './IdentifyCustomer'
import MenuBrowser from './MenuBrowser'
import Cart from './Cart'
import OrderStatus from './OrderStatus'
import ComplaintRatingForm from './ComplaintRatingForm'
import PaymentButton from './PaymentButton'

export default function CustomerView() {
  // Lazy initializers read sessionStorage synchronously on first render, so
  // flipping the role toggle back to Customer (which remounts this component)
  // resumes the in-progress order instead of asking for a name again.
  const [customer, setCustomer] = useState<Customer | null>(() => loadCustomerSession().customer)
  const [cart, setCart] = useState<Record<string, CartLine>>(() => loadCustomerSession().cart)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(() => loadCustomerSession().placedOrder)
  const [isPaid, setIsPaid] = useState(() => loadCustomerSession().isPaid)

  useEffect(() => {
    saveCustomerSession({ customer, cart, placedOrder, isPaid })
  }, [customer, cart, placedOrder, isPaid])

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
    setIsPaid(false)
  }

  function switchCustomer() {
    clearCustomerSession()
    setCustomer(null)
    setCart({})
    setPlacedOrder(null)
    setIsPaid(false)
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
        <OrderStatus orderId={placedOrder.order_id} />
        <ComplaintRatingForm orderId={placedOrder.order_id} customerId={customer.customer_id} />
        <PaymentButton
          orderId={placedOrder.order_id}
          amount={placedOrder.total_order_amount}
          isPaid={isPaid}
          onPaid={() => setIsPaid(true)}
        />
        {isPaid && (
          <button onClick={startNewOrder} className="text-sm underline underline-offset-2 text-ink-soft">
            Start a new order
          </button>
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
