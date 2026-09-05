import { supabase } from '@/lib/supabaseClient'
import { nextId } from '@/lib/ids'

export async function createComplaint(input: {
  orderId: string
  customerId: string
  complaintType: string
  description: string
}) {
  const complaintId = await nextId('complaints', 'complaint_id', 'CMP')

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      complaint_id: complaintId,
      order_id: input.orderId,
      customer_id: input.customerId,
      complaint_type: input.complaintType,
      description: input.description,
      resolution_status: 'Open',
    })
    .select()
    .single()

  if (error) throw error
  return data
}
