import { supabase } from '@/lib/supabaseClient'
import { nextIds } from '@/lib/ids'

export async function createOrderItems(
  orderId: string,
  lines: { menuItemId: string; quantity: number; unitPrice: number }[]
) {
  const orderItemIds = await nextIds('order_items', 'order_item_id', 'OIT', lines.length)

  const rows = lines.map((line, i) => ({
    order_item_id: orderItemIds[i],
    order_id: orderId,
    menu_item_id: line.menuItemId,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    subtotal: line.unitPrice * line.quantity,
  }))

  const { data, error } = await supabase.from('order_items').insert(rows).select()
  if (error) throw error
  return data
}

export async function findOrderItemsByOrder(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*, menu_items(item_name, category)')
    .eq('order_id', orderId)

  if (error) throw error
  return data
}

export async function assignPreparer(
  orderItemId: string,
  preparer: { chefId?: string; bartenderId?: string }
) {
  const { data, error } = await supabase
    .from('order_items')
    .update({
      chef_id: preparer.chefId || null,
      bartender_id: preparer.bartenderId || null,
    })
    .eq('order_item_id', orderItemId)
    .select()
    .single()

  if (error) throw error
  return data
}
