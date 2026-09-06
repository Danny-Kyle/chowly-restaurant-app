import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage } from '@/lib/errors'
import * as orderService from '@/services/orderService'
import { DEFAULT_WAITER_ID } from '@/lib/constants'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const detail = await orderService.getOrderDetail(id)
    return NextResponse.json(detail)
  } catch (err) {
    const message = getErrorMessage(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Body: { action: 'assign', orderItemId, category, staffId } | { action: 'serve' }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (body.action === 'assign') {
      const item = await orderService.assignPreparer(body.orderItemId, body.category, body.staffId)
      return NextResponse.json({ item })
    }

    if (body.action === 'serve') {
      const order = await orderService.markServed(id, DEFAULT_WAITER_ID)
      return NextResponse.json({ order })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message = getErrorMessage(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
