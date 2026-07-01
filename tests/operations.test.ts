import { describe, expect, test } from 'bun:test'
import {
  buildOperationsAuditFields,
  buildOperationsRequestShape,
  formatOperationsStatusSummary,
  operationsActionPolicy,
  redactOperationsLogLine,
  smallestFirstOperationsWorkflow,
  summarizeOperationsCredentialConfig,
} from '../src/operations.ts'

describe('operations, deploy, and status model', () => {
  test('starts with provider-neutral status readback', () => {
    expect(smallestFirstOperationsWorkflow()).toEqual({
      action: 'status.read',
      reason: 'Status readback is useful, provider-neutral, and does not mutate live systems.',
    })

    expect(operationsActionPolicy('status.read')).toEqual({
      risk: 'read',
      approvalRequired: false,
      trustedApprovalRequired: false,
    })
  })

  test('requires approval for deploy/restart and trusted approval for rollback', () => {
    expect(operationsActionPolicy('deploy.start')).toEqual({
      risk: 'write',
      approvalRequired: true,
      trustedApprovalRequired: false,
    })

    expect(operationsActionPolicy('deploy.rollback')).toEqual({
      risk: 'destructive',
      approvalRequired: true,
      trustedApprovalRequired: true,
    })
  })

  test('redacts common secret patterns from logs before Discord output', () => {
    expect(redactOperationsLogLine('Authorization: Bearer abc123 token=secret password=hunter2')).toBe(
      'Authorization: [redacted] token=[redacted] password=[redacted]',
    )
  })

  test('builds audit fields for deploy, restart, and rollback attempts', () => {
    expect(buildOperationsAuditFields({
      action: 'service.restart',
      risk: 'write',
      target: 'bot-prod',
      discordUserId: 'user-1',
      approvalStatus: 'approved',
      ok: true,
      provider: 'fly',
    })).toEqual({
      connector: 'operations',
      action: 'service.restart',
      risk: 'write',
      target: 'bot-prod',
      discord_user_id: 'user-1',
      approval_status: 'approved',
      ok: 'true',
      provider: 'fly',
    })
  })

  test('builds a stable operations request shape with Discord source metadata', () => {
    expect(buildOperationsRequestShape({
      action: 'logs.read',
      target: 'bot-prod',
      discord: {
        chatId: 'thread-1',
        messageId: 'message-1',
        userId: 'user-1',
        scope: 'guild_thread',
      },
    })).toEqual({
      action: 'logs.read',
      target: 'bot-prod',
      discord: {
        chat_id: 'thread-1',
        message_id: 'message-1',
        user_id: 'user-1',
        scope: 'guild_thread',
      },
    })
  })

  test('summarizes credential config without exposing secrets', () => {
    expect(summarizeOperationsCredentialConfig({
      provider: 'fly',
      tokenEnvVar: 'FLY_API_TOKEN',
    })).toEqual({
      provider: 'fly',
      auth: 'token_env:FLY_API_TOKEN',
    })
  })

  test('formats short Discord status summaries', () => {
    expect(formatOperationsStatusSummary({
      target: 'bot-prod',
      status: 'healthy',
      version: '2026.07.01-1',
    })).toBe('bot-prod status: healthy (version 2026.07.01-1)')
  })
})
