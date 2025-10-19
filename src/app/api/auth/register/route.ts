import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { createOtpAndSend } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body
    console.debug('[register] incoming:', { email: email && String(email).slice(0,64), role, name: name && String(name).slice(0,64) })

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Все поля обязательны для заполнения' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    let user
    try {
      user = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as UserRole,
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        }
      })
    } catch (createErr: any) {
      console.error('[register] user.create failed:', createErr)
      return NextResponse.json({ message: 'Failed to create user', detail: String(createErr?.message || createErr) }, { status: 500 })
    }

    // Validate role and create profile based on role
    const allowedRoles = ['CANDIDATE', 'EMPLOYER', 'UNIVERSITY']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
    }

    try {
      if (role === 'CANDIDATE') {
        await db.candidateProfile.create({ data: { userId: user.id } })
      } else if (role === 'EMPLOYER') {
        await db.employerProfile.create({ data: { userId: user.id, companyName: name } })
      } else if (role === 'UNIVERSITY') {
        // Create university profile and link to user
        await db.university.create({ data: { name: name || 'Учебное заведение', userId: user.id } })
      }
    } catch (profileErr: any) {
      console.error('[register] profile creation failed:', profileErr)
      // Attempt rollback of created user to avoid orphaned account
      try {
        await db.user.delete({ where: { id: user.id } })
        console.info('[register] rolled back user after profile creation failure')
      } catch (delErr) {
        console.error('[register] failed to rollback user:', delErr)
      }
      return NextResponse.json({ message: 'Failed to create user profile', detail: String(profileErr?.message || profileErr) }, { status: 500 })
    }

    // Send verification OTP email (non-blocking)
    try {
      createOtpAndSend({
        email,
        purpose: 'verify',
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      }).catch((e) => console.error('Failed to send verification OTP:', e))
    } catch (e) {
      console.error('Failed to schedule verification OTP:', e)
    }

    return NextResponse.json({ message: 'Пользователь успешно зарегистрирован', user })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}