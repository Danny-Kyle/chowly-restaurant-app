import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage } from '@/lib/errors'
import * as orderService from '@/services/orderService'
import { RESTAURANT_ID } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    const statusParam = req.nextUrl.searchParams.get('status')
    const statuses = statusParam ? statusParam.split(',') : ['Pending', 'Served', 'Cancelled']
    const orders = await orderService.getOrderQueue(RESTAURANT_ID, statuses)
    return NextResponse.json({ orders })
  } catch (err) {
    const message = getErrorMessage(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, cart } = await req.json()
    const result = await orderService.placeOrder({
      customerId,
      restaurantId: RESTAURANT_ID,
      cart,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = getErrorMessage(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
