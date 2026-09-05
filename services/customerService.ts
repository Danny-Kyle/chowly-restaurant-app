import * as customerRepository from '@/repositories/customerRepository'

export async function identifyCustomer(firstName: string, lastName: string, phoneNumber?: string) {
  const trimmedFirst = firstName.trim()
  const trimmedLast = (lastName || '').trim()

  if (!trimmedFirst) {
    throw new Error('First name is required')
  }

  const existing = await customerRepository.findCustomerByName(trimmedFirst, trimmedLast)
  if (existing) return existing

  return customerRepository.createCustomer(trimmedFirst, trimmedLast, phoneNumber)
}
