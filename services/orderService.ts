import * as menuRepository from '@/repositories/menuRepository'
import * as orderRepository from '@/repositories/orderRepository'
import * as orderItemRepository from '@/repositories/orderItemRepository'
import * as paymentRepository from '@/repositories/paymentRepository'

type CartLine = { menuItemId: string; quantity: number }

/**
 * Two stations work in parallel — the kitchen (chefs) and the bar (bartenders).
 * Within a station, items are prepared one after another by whoever is assigned.
 * So the order's overall wait is the *slower* of the two stations, not the sum of everything.
 */
function calculateEstimatedWaitingTime(
  lines: { category: string; quantity: number; expected_preparation_time: number }[]
): number {
  const stationTotals: Record<string, number> = {}

  for (const line of lines) {
    const station = line.category === 'drink' ? 'drink' : 'food'
    const timeForThisLine = line.expected_preparation_time * line.quantity
    stationTotals[station] = (stationTotals[station] || 0) + timeForThisLine
  }

  const stationTimes = Object.values(stationTotals)
  return stationTimes.length ? Math.max(...stationTimes) : 0
}

export async function placeOrder(input: {
  customerId: string
  restaurantId: string
  cart: CartLine[]
}) {
  if (!input.cart.length) {
    throw new Error('Cannot place an order with no items')
  }

  const menuItems = await menuRepository.findMenuItemsByIds(input.cart.map((l) => l.menuItemId))

  const lines = input.cart.map((cartLine) => {
    const item = menuItems.find((m) => m.menu_item_id === cartLine.menuItemId)
    if (!item) throw new Error(`Menu item ${cartLine.menuItemId} not found`)
    if (cartLine.quantity < 1) throw new Error('Quantity must be at least 1')

    return {
      menuItemId: item.menu_item_id,
      quantity: cartLine.quantity,
      unitPrice: Number(item.price),
      category: item.category as string,
      expected_preparation_time: item.expected_preparation_time as number,
    }
  })

  const totalOrderAmount = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
  const estimatedWaitingTime = calculateEstimatedWaitingTime(lines)

  const order = await orderRepository.createOrder({
    customerId: input.customerId,
    restaurantId: input.restaurantId,
    estimatedWaitingTime,
    totalOrderAmount,
  })

  const items = await orderItemRepository.createOrderItems(order.order_id, lines)

  return { order, items }
}

export async function getOrderQueue(restaurantId: string, statuses: string[]) {
  return orderRepository.findOrdersByStatus(restaurantId, statuses)
}

export async function getOrderDetail(orderId: string) {
  const [order, items] = await Promise.all([
    orderRepository.findOrderById(orderId),
    orderItemRepository.findOrderItemsByOrder(orderId),
  ])
  return { order, items }
}

export async function assignPreparer(
  orderItemId: string,
  category: string,
  staffId: string
) {
  if (!staffId) throw new Error('A staff member must be selected')

  if (category === 'drink') {
    return orderItemRepository.assignPreparer(orderItemId, { bartenderId: staffId })
  }
  return orderItemRepository.assignPreparer(orderItemId, { chefId: staffId })
}

export async function markServed(orderId: string, waiterId: string) {
  const items = await orderItemRepository.findOrderItemsByOrder(orderId)

  const unassigned = items.filter((i) => !i.chef_id && !i.bartender_id)
  if (unassigned.length > 0) {
    throw new Error('Every item must have a chef or bartender assigned before serving')
  }

  return orderRepository.markOrderServed(orderId, waiterId)
}

export async function payForOrder(orderId: string, amount: number) {
  const payment = await paymentRepository.createPayment(orderId, amount)
  const order = await orderRepository.markOrderPaid(orderId)
  return { payment, order }
}
