import { supabase } from '@/lib/supabaseClient'
import { nextId } from '@/lib/ids'

export async function findCustomerByName(firstName: string, lastName: string) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('first_name', firstName)
    .ilike('last_name', lastName || '')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createCustomer(firstName: string, lastName: string, phoneNumber?: string) {
  const customerId = await nextId('customers', 'customer_id', 'CUS')

  const { data, error } = await supabase
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
