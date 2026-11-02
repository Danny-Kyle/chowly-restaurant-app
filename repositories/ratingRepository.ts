import { getSupabase } from '@/lib/supabaseClient'
import { nextId } from '@/lib/ids'

export async function createRating(input: { orderId: string; ratingScore: number; comments?: string }) {
  const ratingId = await nextId('RAT')

  const { data, error } = await getSupabase()
    .from('ratings')
    .insert({
      rating_id: ratingId,
      order_id: input.orderId,
      rating_score: input.ratingScore,
      comments: input.comments || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
