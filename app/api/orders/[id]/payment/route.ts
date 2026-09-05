import { NextRequest, NextResponse } from 'next/server'
import * as orderService from '@/services/orderService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { amount } = await req.json()
    const result = await orderService.payForOrder(id, amount)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
