import { NextRequest, NextResponse } from 'next/server'
import { getErrorMessage } from '@/lib/errors'
import * as complaintRatingService from '@/services/complaintRatingService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { ratingScore, comments } = await req.json()
    const rating = await complaintRatingService.submitRating({
      orderId: id,
      ratingScore,
      comments,
    })
    return NextResponse.json({ rating })
  } catch (err) {
    const message = getErrorMessage(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
