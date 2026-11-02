import { getSupabase } from '@/lib/supabaseClient'

export async function findOrderItemsByOrder(orderId: string) {
  const { data, error } = await getSupabase()
    .from('order_items')
    .select('*, menu_items(item_name, category)')
    .eq('order_id', orderId)

  if (error) throw error
  return data
}
