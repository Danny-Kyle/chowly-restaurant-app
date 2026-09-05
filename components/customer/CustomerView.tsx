'use client'

import { useState } from 'react'
import type { Customer, CartLine, MenuItem, Order } from '@/lib/types'
import IdentifyCustomer from './IdentifyCustomer'
import MenuBrowser from './MenuBrowser'
import Cart from './Cart'
import OrderStatus from './OrderStatus'
import ComplaintRatingForm from './ComplaintRatingForm'
import PaymentButton from './PaymentButton'

export default function CustomerView() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)
  const [isPaid, setIsPaid] = useState(false)

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

  if (!customer) {
    return <IdentifyCustomer onIdentified={setCustomer} />
  }

  if (placedOrder) {
    return (
      <div className="max-w-md mx-auto px-6 py-10 space-y-4">
        <p className="text-ink-soft text-sm">Table for {customer.first_name}</p>
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
      <p className="text-ink-soft text-sm mb-1">Table for {customer.first_name}</p>
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
