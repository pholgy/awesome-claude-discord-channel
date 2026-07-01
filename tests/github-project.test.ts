import { describe, expect, test } from 'bun:test'
import {
  buildGitHubProjectRequestShape,
  formatDiscordSourceLink,
  formatGitHubChecksSummary,
  githubProjectActionPolicy,
  summarizeGitHubAuthConfig,
} from '../src/github-project.ts'

describe('GitHub and project workflow model', () => {
  test('allows read-only status actions without approval', () => {
    expect(githubProjectActionPolicy('checks.read')).toEqual({
      risk: 'read',
      approvalRequired: false,
      draftFirst: false,
    })
  })

  test('keeps issue and review writing approval-bound', () => {
    expect(githubProjectActionPolicy('issue.comment')).toEqual({
      risk: 'write',
      approvalRequired: true,
      draftFirst: false,
    })

    expect(githubProjectActionPolicy('pr.merge')).toEqual({
      risk: 'destructive',
      approvalRequired: true,
      draftFirst: false,
    })
  })

  test('marks draft actions as draft-first without publishing approval', () => {
    expect(githubProjectActionPolicy('issue.draft')).toEqual({
      risk: 'draft',
      approvalRequired: false,
      draftFirst: true,
    })
  })

  test('builds Discord source backlinks for created GitHub content', () => {
    expect(formatDiscordSourceLink({
      guildId: 'guild-1',
      channelId: 'channel-1',
      messageId: 'message-1',
    })).toBe('Discord source: https://discord.com/channels/guild-1/channel-1/message-1')
  })

  test('formats GitHub check output for Discord summaries', () => {
    expect(formatGitHubChecksSummary({
      target: 'owner/repo#123',
      checks: [
        { name: 'issue-link', conclusion: 'success' },
        { name: 'verify', conclusion: 'failure' },
      ],
    })).toBe('owner/repo#123 checks: 1 passed, 1 failed. Failed: verify')
  })

  test('builds a stable GitHub request shape with Discord source metadata', () => {
    expect(buildGitHubProjectRequestShape({
      action: 'issue.comment',
      target: 'owner/repo#123',
      body: 'Approved summary.',
      discord: {
        chatId: 'thread-1',
        messageId: 'message-1',
        userId: 'user-1',
        scope: 'guild_thread',
      },
    })).toEqual({
      action: 'issue.comment',
      target: 'owner/repo#123',
      body: 'Approved summary.',
      discord: {
        chat_id: 'thread-1',
        message_id: 'message-1',
        user_id: 'user-1',
        scope: 'guild_thread',
      },
    })
  })

  test('summarizes token config without exposing provider secrets or local paths', () => {
    expect(summarizeGitHubAuthConfig({
      tokenEnvVar: 'GITHUB_TOKEN',
      installationIdEnvVar: 'GITHUB_APP_INSTALLATION_ID',
    })).toEqual({
      auth: 'token_env:GITHUB_TOKEN',
      installation: 'env:GITHUB_APP_INSTALLATION_ID',
    })
  })
})
