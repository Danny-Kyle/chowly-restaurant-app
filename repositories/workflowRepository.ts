import { getSupabase } from '@/lib/supabaseClient'

export async function runWorkflow(name: string, parameters: Record<string, unknown>) {
  const { data, error } = await getSupabase().rpc(name, parameters)
  if (error) throw error
  return data
}
