import { describe, expect, test } from 'bun:test'
import {
  ACCEPTED_FILE_ARTIFACT_WORKFLOWS,
  buildFileArtifactRequestShape,
  classifyArtifactDelivery,
  fileArtifactWithinLimits,
  formatArtifactLinkPolicy,
  sensitiveArtifactAllowedInScope,
  smallestFirstFileArtifactWorkflow,
} from '../src/file-artifacts.ts'

describe('file, media, and artifact workflow model', () => {
  test('starts with Discord attachment intake as the first workflow slice', () => {
    expect(ACCEPTED_FILE_ARTIFACT_WORKFLOWS).toContain('ingest_attachment')
    expect(smallestFirstFileArtifactWorkflow()).toEqual({
      workflow: 'ingest_attachment',
      reason: 'Discord attachments are already available to the channel and need limits before external storage.',
    })
  })

  test('enforces first-slice size and type limits', () => {
    expect(fileArtifactWithinLimits({
      sizeBytes: 1024 * 1024,
      mimeType: 'application/pdf',
    })).toEqual({ ok: true })

    expect(fileArtifactWithinLimits({
      sizeBytes: 30 * 1024 * 1024,
      mimeType: 'application/pdf',
    })).toEqual({ ok: false, reason: 'too_large' })

    expect(fileArtifactWithinLimits({
      sizeBytes: 1024,
      mimeType: 'application/x-msdownload',
    })).toEqual({ ok: false, reason: 'unsupported_type' })
  })

  test('chooses inline text only for small text artifacts', () => {
    expect(classifyArtifactDelivery({
      kind: 'text',
      sizeBytes: 1200,
    })).toBe('discord_text')

    expect(classifyArtifactDelivery({
      kind: 'text',
      sizeBytes: 2400,
    })).toBe('discord_attachment')

    expect(classifyArtifactDelivery({
      kind: 'binary',
      sizeBytes: 1200,
    })).toBe('discord_attachment')
  })

  test('blocks sensitive artifacts from shared Discord scopes', () => {
    expect(sensitiveArtifactAllowedInScope({
      sensitivity: 'secret',
      discordScope: 'guild_channel',
    })).toEqual({ ok: false, reason: 'sensitive_artifact_blocked' })

    expect(sensitiveArtifactAllowedInScope({
      sensitivity: 'internal',
      discordScope: 'private_dm',
    })).toEqual({ ok: true })
  })

  test('builds a stable artifact request shape with Discord source metadata', () => {
    expect(buildFileArtifactRequestShape({
      workflow: 'summarize_file',
      attachmentId: 'attachment-1',
      filename: 'incident-log.txt',
      discord: {
        chatId: 'thread-1',
        messageId: 'message-1',
        userId: 'user-1',
        scope: 'guild_thread',
      },
    })).toEqual({
      workflow: 'summarize_file',
      attachment_id: 'attachment-1',
      filename: 'incident-log.txt',
      discord: {
        chat_id: 'thread-1',
        message_id: 'message-1',
        user_id: 'user-1',
        scope: 'guild_thread',
      },
    })
  })

  test('formats expiring external storage policy for Discord summaries', () => {
    expect(formatArtifactLinkPolicy({
      authorized: true,
      expiresInMinutes: 60,
    })).toBe('External artifact link authorized; expires in 60 minutes.')

    expect(formatArtifactLinkPolicy({
      authorized: false,
      expiresInMinutes: 60,
    })).toBe('External artifact link not authorized for this Discord scope.')
  })
})
