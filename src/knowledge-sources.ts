export type KnowledgeSourceType =
  | 'local_docs'
  | 'repo_file'
  | 'discord_pin'
  | 'web_page'
  | 'drive_file'
  | 'notion_page'

export type KnowledgeSourceTypeInfo = {
  type: KnowledgeSourceType
  readOnly: true
  examples: string[]
}

export const KNOWLEDGE_SOURCE_TYPES: KnowledgeSourceTypeInfo[] = [
  { type: 'local_docs', readOnly: true, examples: ['README files', 'runbooks', 'repo docs'] },
  { type: 'repo_file', readOnly: true, examples: ['source files', 'configuration files', 'test files'] },
  { type: 'discord_pin', readOnly: true, examples: ['pinned decisions', 'channel notes'] },
  { type: 'web_page', readOnly: true, examples: ['public docs', 'status pages'] },
  { type: 'drive_file', readOnly: true, examples: ['shared docs', 'spreadsheets'] },
  { type: 'notion_page', readOnly: true, examples: ['team wiki pages', 'project notes'] },
]

export type KnowledgeFirstConnector = {
  type: KnowledgeSourceType
  reason: string
}

export type KnowledgeLookupRequestInput = {
  query: string
  sourceIds: string[]
  discord: {
    chatId: string
    messageId: string
    userId: string
    scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  }
}

export type KnowledgeSourceVisibility =
  | {
      visibility: 'private_dm'
      ownerDiscordUserId: string
    }
  | {
      visibility: 'server_shared'
      guildId: string
    }
  | {
      visibility: 'channel_shared'
      chatId: string
    }

export type KnowledgeDiscordScope = {
  scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  userId: string
  guildId?: string
  chatId?: string
}

export type KnowledgeCitation = {
  index: number
  title: string
  locator: string
  url?: string
}

export type KnowledgeFailureKind =
  | 'unauthorized'
  | 'source_unavailable'
  | 'not_found'
  | 'stale_source'
  | 'source_too_large'

export function smallestFirstKnowledgeConnector(): KnowledgeFirstConnector {
  return {
    type: 'local_docs',
    reason: 'Provider-neutral docs and runbooks can be searched without external account setup.',
  }
}

export function buildKnowledgeLookupRequestShape(input: KnowledgeLookupRequestInput): Record<string, unknown> {
  return {
    query: input.query,
    source_ids: input.sourceIds,
    discord: {
      chat_id: input.discord.chatId,
      message_id: input.discord.messageId,
      user_id: input.discord.userId,
      scope: input.discord.scope,
    },
  }
}

export function knowledgeSourceAllowedInDiscordScope(
  source: KnowledgeSourceVisibility,
  discord: KnowledgeDiscordScope,
): boolean {
  if (source.visibility === 'private_dm') {
    return discord.scope === 'private_dm' && discord.userId === source.ownerDiscordUserId
  }

  if (source.visibility === 'server_shared') {
    return discord.scope !== 'private_dm' && discord.guildId === source.guildId
  }

  return discord.scope !== 'private_dm' && discord.chatId === source.chatId
}

export function formatKnowledgeCitations(citations: KnowledgeCitation[], limit = 3): string {
  if (citations.length === 0) {
    return 'Sources: none'
  }

  const visible = citations
    .slice(0, limit)
    .map(citation => `[${citation.index}] ${citation.title}`)
    .join(', ')
  const remaining = citations.length - limit

  return remaining > 0 ? `Sources: ${visible} (+${remaining} more)` : `Sources: ${visible}`
}

export function formatKnowledgeFailure(kind: KnowledgeFailureKind): string {
  const labels: Record<KnowledgeFailureKind, string> = {
    unauthorized: 'Source unavailable: not authorized for this Discord scope.',
    source_unavailable: 'Source unavailable: connector could not read it.',
    not_found: 'Source unavailable: no matching source found.',
    stale_source: 'Source unavailable: refresh required before answering.',
    source_too_large: 'Source unavailable: too large for the current connector.',
  }

  return labels[kind]
}
