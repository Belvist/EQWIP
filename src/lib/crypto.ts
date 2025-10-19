import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer | null {
  const key = process.env.CHAT_ENCRYPTION_KEY
  if (!key) return null
  const buf = Buffer.from(key, 'base64')
  if (buf.length !== 32) return null
  return buf
}

export function encryptText(plain: string): string {
  const key = getKey()
  if (!key) return plain
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(Buffer.from(plain, 'utf8')), cipher.final()])
  const tag = cipher.getAuthTag()

  // Новый устойчивый формат: префикс + base64(JSON) с полями v, iv, ct, tag
  // Формат: ENC: <base64(json)>
  const envelope = {
    v: 1,
    iv: iv.toString('base64'),
    ct: enc.toString('base64'),
    tag: tag.toString('base64'),
  }
  const jsonB64 = Buffer.from(JSON.stringify(envelope), 'utf8').toString('base64')
  return `ENC:${jsonB64}`
}

export function decryptText(data: string): string {
  try {
    const key = getKey()
    if (!key) return data
    // 1) Новый формат
    if (typeof data === 'string' && data.startsWith('ENC:')) {
      try {
        const jsonStr = Buffer.from(data.slice(4), 'base64').toString('utf8')
        const env = JSON.parse(jsonStr) as { v: number; iv: string; ct: string; tag: string }
        if (env && env.v === 1 && env.iv && env.ct && env.tag) {
          const iv = Buffer.from(env.iv, 'base64')
          const enc = Buffer.from(env.ct, 'base64')
          const tag = Buffer.from(env.tag, 'base64')
          const d = crypto.createDecipheriv(ALGO, key, iv)
          d.setAuthTag(tag)
          const dec = Buffer.concat([d.update(enc), d.final()])
          return dec.toString('utf8')
        }
      } catch {}
    }

    // 2) Старые форматы: base64 байтов с/без разделителей ':'
    const raw = Buffer.from(data, 'base64')

    // Try format without delimiters: [IV(12)][ENC][TAG(16)]
    if (raw.length > IV_LENGTH + TAG_LENGTH) {
      try {
        const iv0 = raw.subarray(0, IV_LENGTH)
        const tag0 = raw.subarray(raw.length - TAG_LENGTH)
        const enc0 = raw.subarray(IV_LENGTH, raw.length - TAG_LENGTH)
        const d0 = crypto.createDecipheriv(ALGO, key, iv0)
        d0.setAuthTag(tag0)
        const dec0 = Buffer.concat([d0.update(enc0), d0.final()])
        return dec0.toString('utf8')
      } catch {}
    }

    // Try delimiter format using first/last ':' positions (старый формат)
    const parts = splitBySeparator(raw, Buffer.from(':'))
    if (parts.length === 3) {
      try {
        const [iv, enc, tag] = parts
        const d1 = crypto.createDecipheriv(ALGO, key, iv)
        d1.setAuthTag(tag)
        const dec1 = Buffer.concat([d1.update(enc), d1.final()])
        return dec1.toString('utf8')
      } catch {}
    }

    return data
  } catch {
    return data
  }
}

export function deepDecrypt(data: string, maxRounds: number = 5): string {
  let output = data
  for (let i = 0; i < maxRounds; i++) {
    const next = decryptText(output)
    if (next === output) break
    output = next
  }
  return output
}

function splitBySeparator(buf: Buffer, sep: Buffer): Buffer[] {
  if (sep.length !== 1) return [buf]
  const s = sep[0]
  const first = buf.indexOf(s)
  const last = buf.lastIndexOf(s)
  if (first === -1 || last === -1 || first === last) return [buf]
  const iv = buf.subarray(0, first)
  const enc = buf.subarray(first + 1, last)
  const tag = buf.subarray(last + 1)
  return [iv, enc, tag]
}


