import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Заглушка удалена: этот endpoint теперь перенаправляет на реальную генерацию PDF
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const target = new URL(`/api/resumes/${params.id}/pdf`, req.url)
  return NextResponse.redirect(target, 307)
}


