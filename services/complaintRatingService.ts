import * as complaintRepository from '@/repositories/complaintRepository'
import * as ratingRepository from '@/repositories/ratingRepository'

export async function fileComplaint(input: {
  orderId: string
  customerId: string
  complaintType: string
  description: string
}) {
  if (!input.description?.trim()) {
    throw new Error('Please describe the issue')
  }
  return complaintRepository.createComplaint(input)
}

export async function submitRating(input: { orderId: string; ratingScore: number; comments?: string }) {
  if (input.ratingScore < 1 || input.ratingScore > 5) {
    throw new Error('Rating must be between 1 and 5')
  }
  return ratingRepository.createRating(input)
}
