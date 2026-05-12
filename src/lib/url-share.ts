import { deflate, inflate } from 'pako'
import { type Session } from '../types'
import { validateSession } from './validation'

export const URL_WARN_LENGTH = 2000
const HASH_PREFIX = '#d='

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): Uint8Array {
  const pad = input.length % 4
  const padded = input + '='.repeat(pad === 0 ? 0 : 4 - pad)
  const normal = padded.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(normal)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export function encodeSession(session: Session): string {
  const json = JSON.stringify(session)
  const bytes = deflate(new TextEncoder().encode(json))
  return base64UrlEncode(bytes)
}

export type DecodeResult =
  | { ok: true; session: Session; encodedLength: number }
  | { ok: false; reason: 'no-hash' | 'malformed' | 'invalid-schema' }

export function decodeShareHash(hash: string): DecodeResult {
  if (!hash.startsWith(HASH_PREFIX)) return { ok: false, reason: 'no-hash' }
  const encoded = hash.slice(HASH_PREFIX.length)
  try {
    const bytes = base64UrlDecode(encoded)
    const json = new TextDecoder().decode(inflate(bytes))
    const parsed = JSON.parse(json)
    const result = validateSession(parsed)
    if (!result.success) return { ok: false, reason: 'invalid-schema' }
    return { ok: true, session: result.data as Session, encodedLength: encoded.length }
  } catch {
    return { ok: false, reason: 'malformed' }
  }
}

export function buildShareUrl(base: string, session: Session): string {
  const trimmed = base.replace(/#.*$/, '')
  return `${trimmed}${HASH_PREFIX}${encodeSession(session)}`
}
