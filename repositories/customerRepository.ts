import { getSupabase } from '@/lib/supabaseClient'
import { nextId } from '@/lib/ids'

export async function createCustomer(firstName: string, lastName: string, phoneNumber?: string) {
  const customerId = await nextId('CUS')

  const { data, error } = await getSupabase()
    .from('customers')
    .insert({
      customer_id: customerId,
      first_name: firstName,
      last_name: lastName || null,
      phone_number: phoneNumber || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
