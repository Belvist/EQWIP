import { cache } from '@/lib/cache'

const hasRedis = !!process.env.REDIS_URL

// In-memory fallback store: email -> expiry timestamp (ms)
const memoryStore: Map<string, number> = new Map()

export async function setTwoFactorMarker(email: string, ttlSeconds: number = 600): Promise<void> {
  const key = `login:2fa:${email.toLowerCase().trim()}`
  if (hasRedis) {
    try {
      await cache.set('login-2fa-marker', { email }, { ok: true }, { ttl: ttlSeconds, key } as any)
      return
    } catch (e) {
      // fallback to memory
    }
  }
  const expiresAt = Date.now() + ttlSeconds * 1000
  memoryStore.set(key, expiresAt)
  // schedule cleanup
  setTimeout(() => {
    const t = memoryStore.get(key)
    if (t && t <= Date.now()) memoryStore.delete(key)
  }, ttlSeconds * 1000 + 1000)
}

export async function hasTwoFactorMarker(email: string): Promise<boolean> {
  const key = `login:2fa:${email.toLowerCase().trim()}`
  if (hasRedis) {
    try {
      return await cache.exists(key)
    } catch (e) {
      // fallback
    }
  }
  const t = memoryStore.get(key)
  if (!t) return false
  if (t <= Date.now()) {
    memoryStore.delete(key)
    return false
  }
  return true
}

export async function clearTwoFactorMarker(email: string): Promise<void> {
  const key = `login:2fa:${email.toLowerCase().trim()}`
  if (hasRedis) {
    try {
      await cache.expire(key, 1)
    } catch (e) {
      // fallback
    }
  }
  memoryStore.delete(key)
}


