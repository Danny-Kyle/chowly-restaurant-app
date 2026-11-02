import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import * as complaintRatingService from '@/services/complaintRatingService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { customerId, complaintType, description } = await readJson(req)
    const complaint = await complaintRatingService.fileComplaint({
      orderId: id,
      customerId,
      complaintType,
      description,
    })
    return NextResponse.json({ complaint })
  } catch (err) {
    return apiError(err)
  }
}
