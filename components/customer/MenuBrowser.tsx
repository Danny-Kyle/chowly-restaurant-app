'use client'

import { useEffect, useState } from 'react'
import type { MenuGroup, CartLine, MenuItem } from '@/lib/types'
import { formatNaira, formatMinutes } from '@/lib/format'

export default function MenuBrowser({
  cart,
  onAdd,
  onRemove,
}: {
  cart: Record<string, CartLine>
  onAdd: (item: MenuItem) => void
  onRemove: (menuItemId: string) => void
}) {
  const [groups, setGroups] = useState<MenuGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => setGroups(data.menu))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-ink-soft">Loading menu…</p>

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.menu_id}>
          <h2 className="font-display text-xl mb-3 border-b border-line pb-2">{group.menu_name}</h2>
          <div className="space-y-3">
            {group.items.map((item) => {
              const qty = cart[item.menu_item_id]?.quantity || 0
              return (
                <div key={item.menu_item_id} className="ticket flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-ink-soft">
                      {formatNaira(item.price)} · {formatMinutes(item.expected_preparation_time)} prep
                    </p>
                  </div>
                  <div className="flex items-center gap-3 font-data">
                    <button
                      onClick={() => onRemove(item.menu_item_id)}
                      disabled={qty === 0}
                      className="w-7 h-7 rounded-sm border border-line disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-4 text-center">{qty}</span>
                    <button
                      onClick={() => onAdd(item)}
                      className="w-7 h-7 rounded-sm border border-line bg-accent-soft"
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
