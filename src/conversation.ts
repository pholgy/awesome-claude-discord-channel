import { ChannelType } from 'discord.js'

export type TriggerReason =
  | 'dm'
  | 'direct_mention'
  | 'reply_to_bot'
  | 'mention_pattern'
  | 'active_thread'
  | 'watch_mode'

export type ConversationScope = 'dm' | 'guild_channel' | 'thread'
export type ContextBoundary = 'private_dm' | 'guild_channel' | 'guild_thread'
export type ContextVisibility = 'private' | 'shared'
export type OutputProfile = 'private_dm' | 'shared_channel' | 'shared_thread'
export type TaskStatus = 'acknowledged' | 'running' | 'waiting' | 'completed' | 'failed' | 'stopped'
export const TASK_STATUSES: TaskStatus[] = ['acknowledged', 'running', 'waiting', 'completed', 'failed', 'stopped']

export type TriggerFacts = {
  isDm: boolean
  requireMention: boolean
  mentionedBot: boolean
  repliedToBot: boolean
  mentionPatternMatched: boolean
  activeThread: boolean
}

export type ConversationMetaInput = {
  channelId: string
  channelType: ChannelType
  isDm: boolean
  isThread: boolean
  triggerReason: TriggerReason
  displayName: string
  guildId?: string | null
  parentChannelId?: string | null
  replyToMessageId?: string | null
  replyToChannelId?: string | null
}

export function resolveTriggerReason(facts: TriggerFacts): TriggerReason | null {
  if (facts.isDm) return 'dm'
  if (!facts.requireMention) return 'watch_mode'
  if (facts.mentionedBot) return 'direct_mention'
  if (facts.repliedToBot) return 'reply_to_bot'
  if (facts.mentionPatternMatched) return 'mention_pattern'
  if (facts.activeThread) return 'active_thread'
  return null
}

export function messageMatchesMentionPattern(text: string, patterns?: string[]): boolean {
  for (const pattern of patterns ?? []) {
    try {
      if (new RegExp(pattern, 'i').test(text)) return true
    } catch {}
  }
  return false
}

export function conversationScope(input: Pick<ConversationMetaInput, 'isDm' | 'isThread'>): ConversationScope {
  if (input.isDm) return 'dm'
  return input.isThread ? 'thread' : 'guild_channel'
}

export function contextBoundary(input: Pick<ConversationMetaInput, 'isDm' | 'isThread'>): ContextBoundary {
  if (input.isDm) return 'private_dm'
  return input.isThread ? 'guild_thread' : 'guild_channel'
}

export function contextVisibility(input: Pick<ConversationMetaInput, 'isDm'>): ContextVisibility {
  return input.isDm ? 'private' : 'shared'
}

export function outputProfile(input: Pick<ConversationMetaInput, 'isDm' | 'isThread'>): OutputProfile {
  if (input.isDm) return 'private_dm'
  return input.isThread ? 'shared_thread' : 'shared_channel'
}

export function channelTypeName(type: ChannelType): string {
  switch (type) {
    case ChannelType.DM:
      return 'dm'
    case ChannelType.GuildText:
      return 'guild_text'
    case ChannelType.GuildAnnouncement:
      return 'guild_announcement'
    case ChannelType.PublicThread:
      return 'public_thread'
    case ChannelType.PrivateThread:
      return 'private_thread'
    case ChannelType.AnnouncementThread:
      return 'announcement_thread'
    default:
      return `discord_channel_type_${type}`
  }
}

export function buildConversationMeta(input: ConversationMetaInput): Record<string, string> {
  const meta: Record<string, string> = {
    conversation_scope: conversationScope(input),
    conversation_scope_id: input.channelId,
    context_boundary: contextBoundary(input),
    context_visibility: contextVisibility(input),
    output_profile: outputProfile(input),
    channel_id: input.channelId,
    channel_type: channelTypeName(input.channelType),
    trigger_reason: input.triggerReason,
    display_name: input.displayName,
  }

  if (input.guildId) meta.guild_id = input.guildId
  if (input.isThread) {
    meta.thread_id = input.channelId
    if (input.parentChannelId) meta.parent_channel_id = input.parentChannelId
  }
  if (input.replyToMessageId) meta.reply_to_message_id = input.replyToMessageId
  if (input.replyToChannelId) meta.reply_to_channel_id = input.replyToChannelId

  return meta
}

export function formatTaskStatus(status: TaskStatus, text?: string): string {
  const label: Record<TaskStatus, string> = {
    acknowledged: 'Acknowledged',
    running: 'Running',
    waiting: 'Waiting',
    completed: 'Done',
    failed: 'Failed',
    stopped: 'Stopped',
  }
  const detail = text?.trim()
  return detail ? `${label[status]}: ${detail}` : label[status]
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as string[]).includes(value)
}
