import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import * as complaintRatingService from '@/services/complaintRatingService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { ratingScore, comments } = await readJson(req)
    const rating = await complaintRatingService.submitRating({
      orderId: id,
      ratingScore,
      comments,
    })
    return NextResponse.json({ rating })
  } catch (err) {
    return apiError(err)
  }
}
