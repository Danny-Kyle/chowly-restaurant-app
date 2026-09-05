import { NextRequest, NextResponse } from 'next/server'
import * as complaintRatingService from '@/services/complaintRatingService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { customerId, complaintType, description } = await req.json()
    const complaint = await complaintRatingService.fileComplaint({
      orderId: id,
      customerId,
      complaintType,
      description,
    })
    return NextResponse.json({ complaint })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
