import { NextResponse } from 'next/server'
import * as staffRepository from '@/repositories/staffRepository'
import { RESTAURANT_ID } from '@/lib/constants'

export async function GET() {
  try {
    const [chefs, bartenders] = await Promise.all([
      staffRepository.findChefsByRestaurant(RESTAURANT_ID),
      staffRepository.findBartendersByRestaurant(RESTAURANT_ID),
    ])
    return NextResponse.json({ chefs, bartenders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
