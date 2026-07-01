import { describe, expect, test } from 'bun:test'
import { ChannelType } from 'discord.js'
import {
  buildConversationMeta,
  channelTypeName,
  contextBoundary,
  contextVisibility,
  messageMatchesMentionPattern,
  outputProfile,
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
      context_boundary: 'guild_thread',
      context_visibility: 'shared',
      output_profile: 'shared_thread',
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
      context_boundary: 'private_dm',
      context_visibility: 'private',
      output_profile: 'private_dm',
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

  test('classifies channel boundaries and visibility', () => {
    expect(contextBoundary({ isDm: true, isThread: false })).toBe('private_dm')
    expect(contextBoundary({ isDm: false, isThread: false })).toBe('guild_channel')
    expect(contextBoundary({ isDm: false, isThread: true })).toBe('guild_thread')
    expect(contextVisibility({ isDm: true })).toBe('private')
    expect(contextVisibility({ isDm: false })).toBe('shared')
    expect(outputProfile({ isDm: true, isThread: false })).toBe('private_dm')
    expect(outputProfile({ isDm: false, isThread: false })).toBe('shared_channel')
    expect(outputProfile({ isDm: false, isThread: true })).toBe('shared_thread')
  })
})
