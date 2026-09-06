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
  const ids = await nextIds(table, idColumn, prefix, 1, padLength)
  return ids[0]
}

/**
 * Generates `count` sequential ids in one go, e.g. ['OIT007', 'OIT008', 'OIT009'].
 *
 * Use this (not a loop of nextId() calls) whenever you're inserting several rows
 * from the same batch before any of them exist in the table yet — e.g. the line
 * items of one order. Looping nextId() there was the actual bug: every call reads
 * the "last id in the table", but since none of the new rows have been inserted
 * yet, every line in the same order read the same last id and computed the same
 * next id, so the second insert collided with the first on the primary key.
 *
 * Note: this still doesn't protect against two different requests generating IDs
 * at the exact same instant (a real production app would use a DB sequence or
 * UUIDs for that) — acceptable here given the scale of this build, but worth
 * knowing if you extend it.
 */
export async function nextIds(
  table: string,
  idColumn: string,
  prefix: string,
  count: number,
  padLength = 3
): Promise<string[]> {
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

  return Array.from({ length: count }, (_, i) =>
    `${prefix}${String(lastNumber + i + 1).padStart(padLength, '0')}`
  )
}
