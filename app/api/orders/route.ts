import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import * as orderService from '@/services/orderService'
import { RESTAURANT_ID } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    const statusParam = req.nextUrl.searchParams.get('status')
    const statuses = statusParam ? statusParam.split(',') : ['Pending', 'Served', 'Cancelled']
    const orders = await orderService.getOrderQueue(RESTAURANT_ID, statuses)
    return NextResponse.json({ orders })
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, cart } = await readJson(req)
    const result = await orderService.placeOrder({
      customerId,
      restaurantId: RESTAURANT_ID,
      cart,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
