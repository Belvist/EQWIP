import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // If reviews are not implemented, return empty array to keep UI stable
    return NextResponse.json({ reviews: [] })
  } catch (error) {
    console.error('Company reviews error:', error)
    return NextResponse.json({ reviews: [] })
  }
}