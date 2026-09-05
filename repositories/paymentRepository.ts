import { supabase } from '@/lib/supabaseClient'
import { nextId } from '@/lib/ids'

export async function createPayment(orderId: string, amount: number) {
  const paymentId = await nextId('payments', 'payment_id', 'PAY')
  const transactionReference = `PRETEND-${Date.now()}`

  const { data, error } = await supabase
    .from('payments')
    .insert({
      payment_id: paymentId,
      order_id: orderId,
      amount,
      payment_method: 'Pretend Payment',
      payment_status: 'Successful',
      transaction_reference: transactionReference,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
