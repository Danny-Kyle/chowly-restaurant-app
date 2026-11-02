import * as customerRepository from '@/repositories/customerRepository'
import { text, optionalText } from '@/lib/validation'

export async function identifyCustomer(firstName: unknown, lastName: unknown, phoneNumber?: unknown) {
  // Names are labels in a shared demo, not proof of identity. Create a distinct customer.
  return customerRepository.createCustomer(text(firstName, 'First name'),
    optionalText(lastName, 'Last name') || '', optionalText(phoneNumber, 'Phone number'))
}
