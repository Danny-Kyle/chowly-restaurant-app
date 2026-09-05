import { NextRequest, NextResponse } from 'next/server'
import * as customerService from '@/services/customerService'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, phoneNumber } = await req.json()
    const customer = await customerService.identifyCustomer(firstName, lastName, phoneNumber)
    return NextResponse.json({ customer })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
