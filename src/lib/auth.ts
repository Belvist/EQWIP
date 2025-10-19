import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { db } from "@/lib/db"
import { cache } from "@/lib/cache"
import bcrypt from "bcryptjs"
import { hasTwoFactorMarker, clearTwoFactorMarker } from '@/lib/twofa'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  providers: [
    ...(process.env.ENABLE_OAUTH_LOGIN === 'true' && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []),
    ...(process.env.ENABLE_OAUTH_LOGIN === 'true' && process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [GitHubProvider({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
        })]
      : []),
    ...(process.env.ENABLE_PASSWORD_LOGIN === 'true'
      ? [CredentialsProvider({
          name: "credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
              return null
            }

            const user = await db.user.findUnique({
              where: { email: credentials.email },
              include: { candidateProfile: true, employerProfile: true },
            })

            if (!user || !user.password) {
              return null
            }

            const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
            if (!isPasswordValid) {
              return null
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              image: user.avatar,
            }
          }
        })]
      : [])
    ,
    ...(process.env.ENABLE_ADMIN_CREDENTIALS !== 'false'
      ? [CredentialsProvider({
          id: 'admin-credentials',
          name: 'Admin Credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' }
          },
          async authorize(credentials) {
            const email = credentials?.email?.toLowerCase().trim()
            const password = credentials?.password || ''
            if (!email || !password) return null

            const user = await db.user.findUnique({ where: { email } })
            if (!user || !user.password) return null

            const ok = await bcrypt.compare(password, user.password)
            if (!ok) return null

            // Only ADMINs are allowed via this provider
            if (String(user.role) !== 'ADMIN') return null

            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
              role: user.role,
              image: user.avatar || undefined,
            }
          }
        })]
      : [])
    ,
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        code: { label: 'Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim()
        const code = credentials?.code?.replace(/\D+/g, '')
        if (!email || !code) return null

        // Try DB first
        try {
          const otp = await db.emailOtp.findFirst({
            where: {
              email,
              purpose: 'LOGIN',
              consumedAt: null,
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
          })
          if (otp) {
            if (otp.attempts >= 5) return null
            const ok = await bcrypt.compare(code, otp.codeHash)
            if (!ok) {
              await db.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
              return null
            }
            await db.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } })
            await clearTwoFactorMarker(email)

            let user = await db.user.findUnique({ where: { email } })
            if (!user) {
              user = await db.user.create({ data: { email, emailVerified: true } })
            } else if (!user.emailVerified) {
              await db.user.update({ where: { id: user.id }, data: { emailVerified: true } })
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
              role: user.role,
              image: user.avatar || undefined,
            }
          }
        } catch {}

        // Fallback to Redis-only OTP (in case DB table missing or email saved there)
        try {
          const key = `otp:LOGIN:${email}`
          const entry = await cache.get<{ codeHash: string; expiresAt: number }>('otp', {}, { key })
          if (entry && entry.expiresAt > Date.now()) {
            const ok = await bcrypt.compare(code, entry.codeHash)
            if (!ok) return null
            await cache.expire(key, 1)
            await clearTwoFactorMarker(email)

            let user = await db.user.findUnique({ where: { email } })
            if (!user) {
              user = await db.user.create({ data: { email, emailVerified: true } })
            } else if (!user.emailVerified) {
              await db.user.update({ where: { id: user.id }, data: { emailVerified: true } })
            }
            return {
              id: user.id,
              email: user.email,
              name: user.name || undefined,
              role: user.role,
              image: user.avatar || undefined,
            }
          }
        } catch {}

        return null
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // persist custom role into JWT
        // @ts-ignore
        token.role = (user as any).role
        token.sub = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // augment session.user with id and role
        // @ts-ignore
        session.user.id = token.sub as string
        // @ts-ignore
        session.user.role = token.role as string
        // Provide stable default fields when user is present
        if (session.user) {
          session.user.name = session.user.name || ''
          session.user.email = session.user.email || ''
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    // NextAuth doesn't have signUp page hook by default
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Use secure cookies only when running over HTTPS
  useSecureCookies: !!process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https://'),
  debug: process.env.NODE_ENV === "development",
}