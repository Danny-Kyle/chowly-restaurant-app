import { NextResponse } from 'next/server'
import * as menuService from '@/services/menuService'
import { RESTAURANT_ID } from '@/lib/constants'

export async function GET() {
  try {
    const menu = await menuService.getMenuForRestaurant(RESTAURANT_ID)
    return NextResponse.json({ menu })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
