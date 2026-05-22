import { describe, it, expect, beforeEach } from 'vitest'
import { hasSeenOnboarding, markOnboardingSeen } from './onboarding'

beforeEach(() => {
  localStorage.clear()
})

describe('onboarding flag', () => {
  it('reports unseen by default', () => {
    expect(hasSeenOnboarding()).toBe(false)
  })

  it('reports seen after marking', () => {
    markOnboardingSeen()
    expect(hasSeenOnboarding()).toBe(true)
  })
})
