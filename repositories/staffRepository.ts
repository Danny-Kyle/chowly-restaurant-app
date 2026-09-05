import { supabase } from '@/lib/supabaseClient'

export async function findChefsByRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('chefs')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (error) throw error
  return data
}

export async function findBartendersByRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('bartenders')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (error) throw error
  return data
}
