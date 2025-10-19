import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Skills normalization (basic): synonyms + cleanup
const SKILL_SYNONYMS: Record<string, string> = {
  'react.js': 'react',
  'reactjs': 'react',
  'nodejs': 'node.js',
  'postgres': 'postgresql',
  'postgre': 'postgresql',
  'tensorflow2': 'tensorflow',
  'py-torch': 'pytorch',
}

export function normalizeSkill(raw: string): string {
  const s = String(raw).trim().toLowerCase()
  const basic = s.replace(/[^a-z0-9+.#-]/g, '')
  const mapped = SKILL_SYNONYMS[basic] || basic
  return mapped
}

export function normalizeSkills(skills: string[]): string[] {
  const out = new Set<string>()
  for (const sk of skills || []) {
    const n = normalizeSkill(sk)
    if (n) out.add(n)
  }
  return Array.from(out)
}
