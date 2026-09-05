import { supabase } from '@/lib/supabaseClient'
import { nextId } from '@/lib/ids'

export async function createOrder(input: {
  customerId: string
  restaurantId: string
  estimatedWaitingTime: number
  totalOrderAmount: number
}) {
  const orderId = await nextId('orders', 'order_id', 'ORD')

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_id: orderId,
      customer_id: input.customerId,
      restaurant_id: input.restaurantId,
      estimated_waiting_time: input.estimatedWaitingTime,
      total_order_amount: input.totalOrderAmount,
      status: 'Pending',
      is_paid: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function findOrdersByStatus(restaurantId: string, statuses: string[]) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(first_name, last_name)')
    .eq('order_id', orderId)
    .single()

  if (error) throw error
  return data
}

export async function markOrderServed(orderId: string, waiterId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'Served', waiter_id: waiterId })
    .eq('order_id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markOrderPaid(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ is_paid: true })
    .eq('order_id', orderId)
    .select()
    .single()

  if (error) throw error
  return data
}
