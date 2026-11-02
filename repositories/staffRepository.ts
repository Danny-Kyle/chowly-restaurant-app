import { getSupabase } from '@/lib/supabaseClient'

export async function findChefsByRestaurant(restaurantId: string) {
  const { data, error } = await getSupabase()
    .from('chefs')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (error) throw error
  return data
}

export async function findBartendersByRestaurant(restaurantId: string) {
  const { data, error } = await getSupabase()
    .from('bartenders')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (error) throw error
  return data
}
