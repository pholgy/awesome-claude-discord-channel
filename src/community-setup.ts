import { readFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(MODULE_DIR, '..')
const TEMPLATE_ROOT = join(REPO_ROOT, 'templates', 'community')

export type CommunityPackId = 'project-dev' | 'support-community' | 'general-community'
export type WorkflowToggle = 'github' | 'docs' | 'files' | 'tasks' | 'operations'
export type CommunityChannelKey =
  | 'support'
  | 'dev'
  | 'announcements'
  | 'feedback'
  | 'moderation'

export type CommunityPackInfo = {
  id: CommunityPackId
  label: string
  description: string
}

export type CommunitySetupInput = {
  packId: CommunityPackId
  serverName: string
  outputDir: string
  enabledWorkflows: WorkflowToggle[]
  channels?: Partial<Record<CommunityChannelKey, string>>
}

export type PackMetadata = {
  id: CommunityPackId
  label: string
  tone: string
  purpose: string
  primaryJobs: string[]
}

export type RenderedProfileFile = {
  relativePath: string
  content: string
}

export type PlannedProfileWrite = {
  path: string
  content: string
}

export type ProfileWritePlan =
  | { ok: true; writes: PlannedProfileWrite[]; existing: string[] }
  | { ok: false; writes: []; existing: string[] }

export const SUPPORTED_COMMUNITY_PACKS: CommunityPackInfo[] = [
  {
    id: 'project-dev',
    label: 'Project Dev',
    description: 'GitHub, docs, releases, bug reports, and contributors.',
  },
  {
    id: 'support-community',
    label: 'Support Community',
    description: 'FAQ, support triage, solved summaries, and escalation.',
  },
  {
    id: 'general-community',
    label: 'General Community',
    description: 'Onboarding, events, announcements, recaps, and moderator help.',
  },
]

export const TARGET_PROFILE_FILES = [
  'CLAUDE.community.md',
  'channels.example.json',
  'workflows.md',
  'moderation.md',
  '.env.example',
] as const

const WORKFLOWS: WorkflowToggle[] = ['github', 'docs', 'files', 'tasks', 'operations']
const MARKDOWN_ESCAPE_PATTERN = /([\\`*_{}[\]()#+\-.!|>])/g

export const COMMUNITY_CHANNEL_KEYS: CommunityChannelKey[] = [
  'support',
  'dev',
  'announcements',
  'feedback',
  'moderation',
]

export const DEFAULT_COMMUNITY_CHANNELS: Record<CommunityChannelKey, string> = {
  support: '#support',
  dev: '#dev',
  announcements: '#announcements',
  feedback: '#feedback',
  moderation: '#mod-log',
}

export function parseWorkflowList(value: string | undefined): WorkflowToggle[] {
  if (!value?.trim()) return []

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      if (!(WORKFLOWS as string[]).includes(item)) {
        throw new Error(`invalid workflow: ${item}`)
      }

      return item as WorkflowToggle
    })
}

export function validateCommunitySetupInput(input: Partial<CommunitySetupInput>): string[] {
  const errors: string[] = []

  if (!input.packId) errors.push('packId is required')
  if (!input.serverName?.trim()) errors.push('serverName is required')
  if (!input.outputDir?.trim()) errors.push('outputDir is required')
  if (input.packId && !SUPPORTED_COMMUNITY_PACKS.some(pack => pack.id === input.packId)) {
    errors.push(`invalid packId: ${input.packId}`)
  }

  return errors
}

export function safeMarkdownValue(value: string): string {
  return JSON.stringify(value).replace(MARKDOWN_ESCAPE_PATTERN, '\\$1')
}

function escapeTrustedMarkdownText(value: string): string {
  return value.replace(/[`[\]]/g, char => `\\${char}`)
}

function readPackMetadata(packId: CommunityPackId): PackMetadata {
  return JSON.parse(readFileSync(join(TEMPLATE_ROOT, packId, 'pack.json'), 'utf8')) as PackMetadata
}

function readSharedTemplate(name: string): string {
  return readFileSync(join(TEMPLATE_ROOT, 'shared', `${name}.template`), 'utf8')
}

function workflowLabel(workflow: WorkflowToggle): string {
  const labels: Record<WorkflowToggle, string> = {
    github: 'GitHub/project workflow',
    docs: 'Docs/source-backed answers',
    files: 'Files/media/artifacts',
    tasks: 'Tasks/calendar/reminders',
    operations: 'Operations/status readback',
  }

  return labels[workflow]
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? '')
}

function normalizeProfilePath(path: string): string {
  return normalize(path).replace(/\\/g, '/')
}

function resolveCommunityChannels(
  channels: CommunitySetupInput['channels'],
): Record<CommunityChannelKey, string> {
  return {
    support: channels?.support ?? DEFAULT_COMMUNITY_CHANNELS.support,
    dev: channels?.dev ?? DEFAULT_COMMUNITY_CHANNELS.dev,
    announcements: channels?.announcements ?? DEFAULT_COMMUNITY_CHANNELS.announcements,
    feedback: channels?.feedback ?? DEFAULT_COMMUNITY_CHANNELS.feedback,
    moderation: channels?.moderation ?? DEFAULT_COMMUNITY_CHANNELS.moderation,
  }
}

export function renderCommunityProfile(input: CommunitySetupInput): RenderedProfileFile[] {
  const pack = readPackMetadata(input.packId)
  const channels = resolveCommunityChannels(input.channels)
  const serverName = safeMarkdownValue(input.serverName)
  const values = {
    serverName,
    serverNameJson: JSON.stringify(input.serverName).slice(1, -1),
    packId: pack.id,
    packLabel: escapeTrustedMarkdownText(pack.label),
    packPurpose: escapeTrustedMarkdownText(pack.purpose),
    packTone: escapeTrustedMarkdownText(pack.tone),
    enabledWorkflowList: input.enabledWorkflows.length
      ? input.enabledWorkflows.map(workflow => `- ${workflowLabel(workflow)}`).join('\n')
      : '- No external workflow lanes enabled by default.',
    primaryJobList: pack.primaryJobs.map(job => `- ${escapeTrustedMarkdownText(job)}`).join('\n'),
    supportChannelJson: JSON.stringify(channels.support).slice(1, -1),
    devChannelJson: JSON.stringify(channels.dev).slice(1, -1),
    announcementsChannelJson: JSON.stringify(channels.announcements).slice(1, -1),
    feedbackChannelJson: JSON.stringify(channels.feedback).slice(1, -1),
    moderationChannelJson: JSON.stringify(channels.moderation).slice(1, -1),
  }

  return TARGET_PROFILE_FILES.map(relativePath => ({
    relativePath,
    content: renderTemplate(readSharedTemplate(relativePath), values).trimEnd() + '\n',
  }))
}

export function planProfileWrites(input: {
  outputDir: string
  files: RenderedProfileFile[]
  existingFiles: Set<string>
  force: boolean
}): ProfileWritePlan {
  const normalizedExistingFiles = new Set(
    Array.from(input.existingFiles, path => normalizeProfilePath(path)),
  )
  const writes = input.files.map(file => ({
    path: normalizeProfilePath(join(input.outputDir, file.relativePath)),
    content: file.content,
  }))
  const existing = writes
    .map(write => write.path)
    .filter(path => normalizedExistingFiles.has(path))

  if (existing.length > 0 && !input.force) {
    return { ok: false, writes: [], existing }
  }

  return { ok: true, writes, existing }
}
