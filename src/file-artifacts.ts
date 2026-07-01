export type FileArtifactWorkflow =
  | 'ingest_attachment'
  | 'summarize_file'
  | 'transform_file'
  | 'generate_artifact'
  | 'store_artifact'

export const ACCEPTED_FILE_ARTIFACT_WORKFLOWS: FileArtifactWorkflow[] = [
  'ingest_attachment',
  'summarize_file',
  'transform_file',
  'generate_artifact',
  'store_artifact',
]

export const FILE_ARTIFACT_MAX_BYTES = 25 * 1024 * 1024

export const ACCEPTED_FILE_ARTIFACT_MIME_TYPES = [
  'application/json',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/csv',
  'text/markdown',
  'text/plain',
] as const

export type FileArtifactLimitInput = {
  sizeBytes: number
  mimeType: string
}

export type FileArtifactLimitResult =
  | { ok: true }
  | { ok: false; reason: 'too_large' | 'unsupported_type' }

export type ArtifactDeliveryInput = {
  kind: 'text' | 'binary'
  sizeBytes: number
}

export type ArtifactDelivery = 'discord_text' | 'discord_attachment'

export type ArtifactSensitivity = 'public' | 'internal' | 'secret'

export type FileArtifactRequestInput = {
  workflow: FileArtifactWorkflow
  attachmentId: string
  filename: string
  discord: {
    chatId: string
    messageId: string
    userId: string
    scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  }
}

export type FileArtifactFirstWorkflow = {
  workflow: FileArtifactWorkflow
  reason: string
}

export function smallestFirstFileArtifactWorkflow(): FileArtifactFirstWorkflow {
  return {
    workflow: 'ingest_attachment',
    reason: 'Discord attachments are already available to the channel and need limits before external storage.',
  }
}

export function fileArtifactWithinLimits(input: FileArtifactLimitInput): FileArtifactLimitResult {
  if (input.sizeBytes > FILE_ARTIFACT_MAX_BYTES) {
    return { ok: false, reason: 'too_large' }
  }

  if (!(ACCEPTED_FILE_ARTIFACT_MIME_TYPES as readonly string[]).includes(input.mimeType)) {
    return { ok: false, reason: 'unsupported_type' }
  }

  return { ok: true }
}

export function classifyArtifactDelivery(input: ArtifactDeliveryInput): ArtifactDelivery {
  return input.kind === 'text' && input.sizeBytes <= 1800 ? 'discord_text' : 'discord_attachment'
}

export function sensitiveArtifactAllowedInScope(input: {
  sensitivity: ArtifactSensitivity
  discordScope: 'private_dm' | 'guild_channel' | 'guild_thread'
}): { ok: true } | { ok: false; reason: 'sensitive_artifact_blocked' } {
  if (input.sensitivity === 'secret' && input.discordScope !== 'private_dm') {
    return { ok: false, reason: 'sensitive_artifact_blocked' }
  }

  return { ok: true }
}

export function buildFileArtifactRequestShape(input: FileArtifactRequestInput): Record<string, unknown> {
  return {
    workflow: input.workflow,
    attachment_id: input.attachmentId,
    filename: input.filename,
    discord: {
      chat_id: input.discord.chatId,
      message_id: input.discord.messageId,
      user_id: input.discord.userId,
      scope: input.discord.scope,
    },
  }
}

export function formatArtifactLinkPolicy(input: {
  authorized: boolean
  expiresInMinutes: number
}): string {
  if (!input.authorized) {
    return 'External artifact link not authorized for this Discord scope.'
  }

  return `External artifact link authorized; expires in ${input.expiresInMinutes} minutes.`
}
