import { describe, expect, test } from 'bun:test'
import {
  KNOWLEDGE_SOURCE_TYPES,
  buildKnowledgeLookupRequestShape,
  formatKnowledgeCitations,
  formatKnowledgeFailure,
  knowledgeSourceAllowedInDiscordScope,
  smallestFirstKnowledgeConnector,
} from '../src/knowledge-sources.ts'

describe('knowledge and source connector model', () => {
  test('starts with read-only source types and a local docs first slice', () => {
    expect(KNOWLEDGE_SOURCE_TYPES.every(source => source.readOnly)).toBe(true)
    expect(KNOWLEDGE_SOURCE_TYPES.map(source => source.type)).toContain('local_docs')
    expect(smallestFirstKnowledgeConnector()).toEqual({
      type: 'local_docs',
      reason: 'Provider-neutral docs and runbooks can be searched without external account setup.',
    })
  })

  test('builds a stable lookup request shape with Discord source metadata', () => {
    expect(buildKnowledgeLookupRequestShape({
      query: 'what did we decide about visible replies?',
      sourceIds: ['runbook'],
      discord: {
        chatId: 'channel-1',
        messageId: 'message-1',
        userId: 'user-1',
        scope: 'guild_thread',
      },
    })).toEqual({
      query: 'what did we decide about visible replies?',
      source_ids: ['runbook'],
      discord: {
        chat_id: 'channel-1',
        message_id: 'message-1',
        user_id: 'user-1',
        scope: 'guild_thread',
      },
    })
  })

  test('keeps private DM sources out of shared Discord scopes', () => {
    const privateSource = {
      visibility: 'private_dm' as const,
      ownerDiscordUserId: 'user-1',
    }

    expect(knowledgeSourceAllowedInDiscordScope(privateSource, {
      scope: 'private_dm',
      userId: 'user-1',
    })).toBe(true)

    expect(knowledgeSourceAllowedInDiscordScope(privateSource, {
      scope: 'guild_channel',
      userId: 'user-1',
    })).toBe(false)
  })

  test('allows server-shared sources only inside the matching guild', () => {
    const serverSource = {
      visibility: 'server_shared' as const,
      guildId: 'guild-1',
    }

    expect(knowledgeSourceAllowedInDiscordScope(serverSource, {
      scope: 'guild_channel',
      userId: 'user-1',
      guildId: 'guild-1',
    })).toBe(true)

    expect(knowledgeSourceAllowedInDiscordScope(serverSource, {
      scope: 'private_dm',
      userId: 'user-1',
      guildId: 'guild-1',
    })).toBe(false)
  })

  test('formats Discord-sized citations without dumping source content', () => {
    expect(formatKnowledgeCitations([
      { index: 1, title: 'README.md', locator: 'README.md#project-direction' },
      { index: 2, title: 'SPEC.md', locator: 'SPEC.md#goals' },
      { index: 3, title: 'ACCESS.md', locator: 'ACCESS.md#examples' },
      { index: 4, title: 'Issue #13', locator: 'github#13' },
    ])).toBe('Sources: [1] README.md, [2] SPEC.md, [3] ACCESS.md (+1 more)')
  })

  test('uses stable source failure wording', () => {
    expect(formatKnowledgeFailure('unauthorized')).toBe('Source unavailable: not authorized for this Discord scope.')
    expect(formatKnowledgeFailure('source_unavailable')).toBe('Source unavailable: connector could not read it.')
  })
})
