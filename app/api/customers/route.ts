import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import * as customerService from '@/services/customerService'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, phoneNumber } = await readJson(req)
    const customer = await customerService.identifyCustomer(firstName, lastName, phoneNumber)
    return NextResponse.json({ customer })
  } catch (err) {
    return apiError(err)
  }
}
