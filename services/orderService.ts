import * as orderRepository from '@/repositories/orderRepository'
import * as orderItemRepository from '@/repositories/orderItemRepository'
import { runWorkflow } from '@/repositories/workflowRepository'
import { cartLines, choice, numeric, text } from '@/lib/validation'

export async function placeOrder(input: { customerId: unknown; restaurantId: unknown; cart: unknown }) {
  return runWorkflow('chowly_place_order', { p_customer: text(input.customerId, 'Customer'),
    p_restaurant: text(input.restaurantId, 'Restaurant'), p_cart: cartLines(input.cart) })
}
export async function getOrderQueue(restaurantId: string, statuses: string[]) {
  statuses.forEach(status => choice(status, ['Pending', 'Served', 'Cancelled'], 'order status'))
  return orderRepository.findOrdersByStatus(restaurantId, statuses)
}
export async function getOrderDetail(orderId: string) {
  const [order, items] = await Promise.all([orderRepository.findOrderById(text(orderId, 'Order')),
    orderItemRepository.findOrderItemsByOrder(orderId)])
  return { order, items }
}
export async function assignPreparer(orderId: string, orderItemId: unknown, staffId: unknown) {
  return runWorkflow('chowly_assign_preparer', { p_order: text(orderId, 'Order'),
    p_item: text(orderItemId, 'Order item'), p_staff: text(staffId, 'Staff member') })
}
export async function markServed(orderId: string, waiterId: string) {
  return runWorkflow('chowly_serve_order', { p_order: text(orderId, 'Order'), p_waiter: text(waiterId, 'Waiter') })
}
export async function cancelOrder(orderId: string, cancelledBy: unknown) {
  return runWorkflow('chowly_cancel_order', { p_order: text(orderId, 'Order'),
    p_actor: choice(cancelledBy, ['customer', 'waiter'], 'cancellation role') })
}
export async function payForOrder(orderId: string, amount: unknown) {
  return runWorkflow('chowly_pay_order', { p_order: text(orderId, 'Order'), p_amount: numeric(amount, 'Amount') })
}
