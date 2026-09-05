import { supabase } from '@/lib/supabaseClient'

export async function findMenusByRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'In Circulation')

  if (error) throw error
  return data
}

export async function findAvailableItemsByRestaurant(restaurantId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, menus!inner(restaurant_id)')
    .eq('menus.restaurant_id', restaurantId)
    .eq('availability_status', 'Available')

  if (error) throw error
  return data
}

export async function findMenuItemsByIds(menuItemIds: string[]) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .in('menu_item_id', menuItemIds)

  if (error) throw error
  return data
}
