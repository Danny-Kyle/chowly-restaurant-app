import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import * as orderService from '@/services/orderService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { amount } = await readJson(req)
    const result = await orderService.payForOrder(id, amount)
    return NextResponse.json(result)
  } catch (err) {
    return apiError(err)
  }
}
