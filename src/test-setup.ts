import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { MotionGlobalConfig } from 'framer-motion'

// Disable framer-motion animations in tests so exit transitions don't race assertions
MotionGlobalConfig.skipAnimations = true

afterEach(() => cleanup())
