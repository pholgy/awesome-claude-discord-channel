import { describe, expect, test } from 'bun:test'
import {
  buildExternalAuditFields,
  externalApprovalRequired,
  formatExternalApprovalStatus,
  isExternalActionRisk,
} from '../src/external.ts'

describe('external connector safety model', () => {
  test('validates known risk levels', () => {
    expect(isExternalActionRisk('read')).toBe(true)
    expect(isExternalActionRisk('draft')).toBe(true)
    expect(isExternalActionRisk('write')).toBe(true)
    expect(isExternalActionRisk('destructive')).toBe(true)
    expect(isExternalActionRisk('admin')).toBe(false)
  })

  test('requires approval for mutating risk levels', () => {
    expect(externalApprovalRequired('read')).toBe(false)
    expect(externalApprovalRequired('draft')).toBe(false)
    expect(externalApprovalRequired('write')).toBe(true)
    expect(externalApprovalRequired('destructive')).toBe(true)
  })

  test('builds audit fields without secrets', () => {
    expect(buildExternalAuditFields({
      connector: 'github',
      action: 'issue.comment',
      risk: 'write',
      discordScope: 'guild_thread',
      discordUserId: 'user-1',
      approvalStatus: 'approved',
      target: 'repo#123',
      ok: true,
    })).toEqual({
      connector: 'github',
      action: 'issue.comment',
      risk: 'write',
      discord_scope: 'guild_thread',
      discord_user_id: 'user-1',
      approval_status: 'approved',
      target: 'repo#123',
      ok: 'true',
    })
  })

  test('formats denied and expired approvals for Discord', () => {
    expect(formatExternalApprovalStatus('denied')).toBe('External action denied.')
    expect(formatExternalApprovalStatus('expired')).toBe('External action approval expired.')
  })
})
