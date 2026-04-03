import { describe, it, expect } from 'vitest'
import { createTestCaller } from './setup'

describe('Auth Guards', () => {
  it('should reject unauthenticated requests to protected procedures', async () => {
    // Caller with no user
    const caller = createTestCaller(null)

    // Using me.session which is a protectedProcedure
    await expect(caller.me.session()).rejects.toThrowError('UNAUTHORIZED')
  })

  it('should allow authenticated requests to protected procedures', async () => {
    const user = { id: 'test-user', name: 'Test User' }
    const caller = createTestCaller(user)

    const session = await caller.me.session()
    expect(session).not.toBeNull()
    expect(session!.user).toBeDefined()
    expect(session!.user?.id).toBe('test-user')
  })
})
