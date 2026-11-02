import * as complaintRepository from '@/repositories/complaintRepository'
import * as ratingRepository from '@/repositories/ratingRepository'
import * as orderRepository from '@/repositories/orderRepository'
import { runWorkflow } from '@/repositories/workflowRepository'
import { AppError } from '@/lib/errors'
import { choice, optionalText, ratingScore, text } from '@/lib/validation'

export async function submitFeedback(input: Record<string, unknown>) {
  return runWorkflow('chowly_submit_feedback', { p_order: text(input.orderId, 'Order'),
    p_customer: text(input.customerId, 'Customer'),
    p_type: choice(input.complaintType, ['Delay', 'Quality', 'Other'], 'complaint type'),
    p_description: text(input.description, 'Description'), p_score: ratingScore(input.ratingScore),
    p_comments: optionalText(input.comments, 'Comments') || null })
}
// Individual endpoints remain available; the combined UI uses the atomic workflow above.
export async function fileComplaint(input: Record<string, unknown>) {
  const orderId = text(input.orderId, 'Order')
  const customerId = text(input.customerId, 'Customer')
  const order = await orderRepository.findOrderById(orderId)
  if (order.customer_id !== customerId) throw new AppError(400, 'Customer does not match this order')
  if (order.status === 'Cancelled') throw new AppError(409, 'Cannot submit feedback for a cancelled order')
  return complaintRepository.createComplaint({ orderId, customerId,
    complaintType: choice(input.complaintType, ['Delay', 'Quality', 'Other'], 'complaint type'),
    description: text(input.description, 'Description') })
}
export async function submitRating(input: Record<string, unknown>) {
  const orderId = text(input.orderId, 'Order')
  const score = ratingScore(input.ratingScore)
  const order = await orderRepository.findOrderById(orderId)
  if (order.status === 'Cancelled') throw new AppError(409, 'Cannot submit feedback for a cancelled order')
  return ratingRepository.createRating({ orderId, ratingScore: score, comments: optionalText(input.comments, 'Comments') })
}
