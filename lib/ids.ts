import { supabase } from './supabaseClient'

/**
 * Generates the next sequential id for a table that uses ids like 'ORD001', 'PAY014', etc.
 * Looks at the highest existing id with this prefix and increments the numeric part.
 */
export async function nextId(
  table: string,
  idColumn: string,
  prefix: string,
  padLength = 3
): Promise<string> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .ilike(idColumn, `${prefix}%`)
    .order(idColumn, { ascending: false })
    .limit(1)

  if (error) throw error

  const first = data?.[0] as Record<string, unknown> | undefined
  const last = first?.[idColumn] as string | undefined
  const lastNumber = last ? parseInt(last.replace(prefix, ''), 10) : 0
  const nextNumber = lastNumber + 1

  return `${prefix}${String(nextNumber).padStart(padLength, '0')}`
}
