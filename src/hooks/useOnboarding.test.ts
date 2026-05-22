import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboarding } from './useOnboarding'
import { resetSession, useSession } from '../store/session'
import { markOnboardingSeen } from '../lib/onboarding'

beforeEach(() => {
  localStorage.clear()
  resetSession()
  window.location.hash = ''
})

describe('useOnboarding', () => {
  it('shows the tour for a brand-new visitor', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.view).toBe('tour')
  })

  it('shows welcome-back when a session has data but onboarding was never seen', () => {
    useSession.getState().addPerson('Alice')
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.view).toBe('welcome-back')
  })

  it('shows nothing once onboarding has been seen', () => {
    markOnboardingSeen()
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.view).toBeNull()
  })

  it('shows nothing when arriving via a share link', () => {
    window.location.hash = '#d=abc123'
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.view).toBeNull()
  })

  it('dismiss marks onboarding seen and clears the view', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => result.current.dismiss())
    expect(result.current.view).toBeNull()
    expect(localStorage.getItem('expense-calculator-onboarding')).toBe('1')
  })

  it('startTour reopens the tour even after it was seen', () => {
    markOnboardingSeen()
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.view).toBeNull()
    act(() => result.current.startTour())
    expect(result.current.view).toBe('tour')
  })
})
