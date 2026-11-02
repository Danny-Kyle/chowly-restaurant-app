import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import * as orderService from '@/services/orderService'
import { DEFAULT_WAITER_ID } from '@/lib/constants'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const detail = await orderService.getOrderDetail(id)
    return NextResponse.json(detail)
  } catch (err) {
    return apiError(err)
  }
}

// Body: { action: 'assign', orderItemId, staffId } | { action: 'serve' } | { action: 'cancel', cancelledBy }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson(req)

    if (body.action === 'assign') {
      const item = await orderService.assignPreparer(id, body.orderItemId, body.staffId)
      return NextResponse.json({ item })
    }

    if (body.action === 'serve') {
      const order = await orderService.markServed(id, DEFAULT_WAITER_ID)
      return NextResponse.json({ order })
    }

    if (body.action === 'cancel') {
      const order = await orderService.cancelOrder(id, body.cancelledBy)
      return NextResponse.json({ order })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return apiError(err)
  }
}
