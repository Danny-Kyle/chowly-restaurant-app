'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Order, OrderItem } from '@/lib/types'

export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`)
    const data = await res.json()
    setOrder(data.order)
    setItems(data.items)
  }, [orderId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const res = await fetch(`/api/orders/${orderId}`)
      const data = await res.json()
      if (!cancelled) {
        setOrder(data.order)
        setItems(data.items)
      }
    }
    load()
    const interval = setInterval(load, 5000) // picks up waiter actions (assign/serve/cancel) without a manual refresh
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orderId])

  return { order, items, refresh }
}
