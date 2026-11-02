import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import { readJson } from '@/lib/validation'
import { submitFeedback } from '@/services/complaintRatingService'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await readJson(req)
    const result = await submitFeedback({ ...body, orderId: id })
    return NextResponse.json(result, { status: 201 })
  } catch (error) { return apiError(error) }
}
