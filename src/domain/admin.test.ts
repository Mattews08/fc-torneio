import { describe, expect, it } from 'vitest'
import { ADMIN_EMAIL, canManageTeams } from './admin'

describe('admin access', () => {
  it('allows the configured email to manage teams regardless of casing', () => {
    expect(canManageTeams(ADMIN_EMAIL.toUpperCase())).toBe(true)
  })

  it('blocks other authenticated users from managing teams', () => {
    expect(canManageTeams('friend@example.com')).toBe(false)
    expect(canManageTeams(null)).toBe(false)
  })
})
