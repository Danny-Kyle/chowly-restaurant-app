import * as menuRepository from '@/repositories/menuRepository'

export async function getMenuForRestaurant(restaurantId: string) {
  const [menus, items] = await Promise.all([
    menuRepository.findMenusByRestaurant(restaurantId),
    menuRepository.findAvailableItemsByRestaurant(restaurantId),
  ])

  // group items under their menu, e.g. { "Food Menu": [...], "Drinks Menu": [...] }
  return menus.map((menu) => ({
    ...menu,
    items: items.filter((item) => item.menu_id === menu.menu_id),
  }))
}
