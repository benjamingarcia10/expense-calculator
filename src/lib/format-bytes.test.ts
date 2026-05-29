import { describe, it, expect } from 'vitest'
import { formatBytes } from './format-bytes'

describe('formatBytes', () => {
  it('formats bytes', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('formats megabytes with one decimal', () => {
    expect(formatBytes(1_200_000)).toBe('1.1 MB')
  })

  it('drops the decimal for whole numbers', () => {
    expect(formatBytes(2 * 1024 * 1024)).toBe('2 MB')
  })

  it('handles zero', () => {
    expect(formatBytes(0)).toBe('0 B')
  })
})
