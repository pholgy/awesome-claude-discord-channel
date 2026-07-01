import { describe, expect, test } from 'bun:test'
import {
  buildCustomActionRequestShape,
  customActionApprovalRequired,
  normalizeCustomActionConfig,
  redactCustomActionHeaders,
} from '../src/custom-actions.ts'

describe('custom action connector model', () => {
  test('normalizes defaults from risk level', () => {
    expect(normalizeCustomActionConfig({
      id: 'github-comment',
      name: 'GitHub comment',
      url: 'https://example.test/comment',
      method: 'POST',
      risk: 'write',
    })).toEqual({
      id: 'github-comment',
      name: 'GitHub comment',
      url: 'https://example.test/comment',
      method: 'POST',
      risk: 'write',
      approval_required: true,
      timeout_ms: 30000,
      retry: 'none',
    })
  })

  test('does not allow config to weaken approval below risk policy', () => {
    expect(customActionApprovalRequired({
      risk: 'destructive',
      approval_required: false,
    })).toBe(true)
  })

  test('builds a stable JSON request shape', () => {
    expect(buildCustomActionRequestShape({
      actionId: 'deploy-status',
      input: { service: 'api' },
      discord: {
        chatId: 'channel-1',
        messageId: 'message-1',
        userId: 'user-1',
        scope: 'guild_channel',
      },
    })).toEqual({
      action_id: 'deploy-status',
      input: { service: 'api' },
      discord: {
        chat_id: 'channel-1',
        message_id: 'message-1',
        user_id: 'user-1',
        scope: 'guild_channel',
      },
    })
  })

  test('redacts secret headers for audit output', () => {
    expect(redactCustomActionHeaders({
      Authorization: 'Bearer token',
      'X-Trace-Id': 'trace-1',
    })).toEqual({
      Authorization: '[redacted]',
      'X-Trace-Id': 'trace-1',
    })
  })
})
