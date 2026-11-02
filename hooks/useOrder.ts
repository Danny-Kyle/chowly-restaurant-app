'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Order, OrderItem } from '@/lib/types'

export function useOrder(orderId: string) {
  const [detail, setDetail] = useState<{ id: string; order: Order | null; items: OrderItem[] }>({ id: '', order: null, items: [] })
  const [error, setError] = useState('')
  const activeId = useRef(orderId)
  useEffect(() => { activeId.current = orderId }, [orderId])
  const refresh = useCallback(async () => {
    if (!orderId) return
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not load order')
      if (activeId.current !== orderId) return
      setDetail({ id: orderId, order: data.order, items: data.items })
      setError('')
    } catch (error) {
      if (activeId.current === orderId) setError(error instanceof Error ? error.message : 'Could not load order')
    }
  }, [orderId])
  useEffect(() => {
    if (!orderId) return
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      await refresh()
      if (!stopped) timer = setTimeout(poll, 5000)
    }
    void poll()
    return () => { stopped = true; clearTimeout(timer); activeId.current = '' }
  }, [orderId, refresh])
  return { order: detail.id === orderId ? detail.order : null,
    items: detail.id === orderId ? detail.items : [], error, refresh }
}
