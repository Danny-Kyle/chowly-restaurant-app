import { getSupabase } from '@/lib/supabaseClient'

export async function findOrdersByStatus(restaurantId: string, statuses: string[]) {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*, customers(first_name, last_name)')
    .eq('restaurant_id', restaurantId)
    .in('status', statuses)
    .order('order_date', { ascending: true })
    .order('order_time', { ascending: true })

  if (error) throw error
  return data
}

export async function findOrderById(orderId: string) {
  const { data, error } = await getSupabase()
    .from('orders')
    .select('*, customers(first_name, last_name)')
    .eq('order_id', orderId)
    .single()

  if (error) throw error
  return data
}
