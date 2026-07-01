import { describe, expect, test } from 'bun:test'
import { ChannelType } from 'discord.js'
import {
  buildConversationMeta,
  channelTypeName,
  messageMatchesMentionPattern,
  resolveTriggerReason,
} from '../src/conversation.ts'

describe('resolveTriggerReason', () => {
  test('routes DMs without a mention requirement', () => {
    expect(resolveTriggerReason({
      isDm: true,
      requireMention: true,
      mentionedBot: false,
      repliedToBot: false,
      mentionPatternMatched: false,
      activeThread: false,
    })).toBe('dm')
  })

  test('preserves existing guild trigger priority', () => {
    expect(resolveTriggerReason({
      isDm: false,
      requireMention: true,
      mentionedBot: true,
      repliedToBot: true,
      mentionPatternMatched: true,
      activeThread: true,
    })).toBe('direct_mention')

    expect(resolveTriggerReason({
      isDm: false,
      requireMention: true,
      mentionedBot: false,
      repliedToBot: true,
      mentionPatternMatched: true,
      activeThread: true,
    })).toBe('reply_to_bot')

    expect(resolveTriggerReason({
      isDm: false,
      requireMention: true,
      mentionedBot: false,
      repliedToBot: false,
      mentionPatternMatched: true,
      activeThread: true,
    })).toBe('mention_pattern')
  })

  test('lets active threads continue without repeated mentions', () => {
    expect(resolveTriggerReason({
      isDm: false,
      requireMention: true,
      mentionedBot: false,
      repliedToBot: false,
      mentionPatternMatched: false,
      activeThread: true,
    })).toBe('active_thread')
  })

  test('uses watch mode only when mention is not required', () => {
    expect(resolveTriggerReason({
      isDm: false,
      requireMention: false,
      mentionedBot: false,
      repliedToBot: false,
      mentionPatternMatched: false,
      activeThread: true,
    })).toBe('watch_mode')
  })

  test('stays silent for unaddressed guild messages', () => {
    expect(resolveTriggerReason({
      isDm: false,
      requireMention: true,
      mentionedBot: false,
      repliedToBot: false,
      mentionPatternMatched: false,
      activeThread: false,
    })).toBeNull()
  })
})

describe('messageMatchesMentionPattern', () => {
  test('matches configured nickname patterns case-insensitively', () => {
    expect(messageMatchesMentionPattern('Hey Assistant, check this', ['^hey assistant\\b'])).toBe(true)
  })

  test('ignores invalid regex patterns', () => {
    expect(messageMatchesMentionPattern('hey assistant', ['[', '^hey assistant\\b'])).toBe(true)
  })
})

describe('buildConversationMeta', () => {
  test('builds isolated thread metadata', () => {
    expect(buildConversationMeta({
      channelId: 'thread-1',
      channelType: ChannelType.PublicThread,
      isDm: false,
      isThread: true,
      triggerReason: 'reply_to_bot',
      displayName: 'Pat',
      guildId: 'guild-1',
      parentChannelId: 'channel-1',
      replyToMessageId: 'message-0',
      replyToChannelId: 'thread-1',
    })).toEqual({
      conversation_scope: 'thread',
      conversation_scope_id: 'thread-1',
      channel_id: 'thread-1',
      channel_type: 'public_thread',
      trigger_reason: 'reply_to_bot',
      display_name: 'Pat',
      guild_id: 'guild-1',
      thread_id: 'thread-1',
      parent_channel_id: 'channel-1',
      reply_to_message_id: 'message-0',
      reply_to_channel_id: 'thread-1',
    })
  })

  test('builds private DM metadata without guild fields', () => {
    expect(buildConversationMeta({
      channelId: 'dm-1',
      channelType: ChannelType.DM,
      isDm: true,
      isThread: false,
      triggerReason: 'dm',
      displayName: 'Sam',
    })).toEqual({
      conversation_scope: 'dm',
      conversation_scope_id: 'dm-1',
      channel_id: 'dm-1',
      channel_type: 'dm',
      trigger_reason: 'dm',
      display_name: 'Sam',
    })
  })

  test('names known Discord channel types', () => {
    expect(channelTypeName(ChannelType.GuildText)).toBe('guild_text')
    expect(channelTypeName(ChannelType.GuildAnnouncement)).toBe('guild_announcement')
  })
})
