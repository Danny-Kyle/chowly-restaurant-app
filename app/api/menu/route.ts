import { NextResponse } from 'next/server'
import { apiError } from '@/lib/errors'
import * as menuService from '@/services/menuService'
import { RESTAURANT_ID } from '@/lib/constants'

export async function GET() {
  try {
    const menu = await menuService.getMenuForRestaurant(RESTAURANT_ID)
    return NextResponse.json({ menu })
  } catch (err) {
    return apiError(err)
  }
}
