import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(MODULE_DIR, '..')
const TEMPLATE_ROOT = join(REPO_ROOT, 'templates', 'community')

export type CommunityPackId = 'project-dev' | 'support-community' | 'general-community'
export type WorkflowToggle = 'github' | 'docs' | 'files' | 'tasks' | 'operations'

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
  channels?: Partial<Record<'support' | 'dev' | 'announcements' | 'feedback' | 'moderation', string>>
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

export function renderCommunityProfile(input: CommunitySetupInput): RenderedProfileFile[] {
  const pack = readPackMetadata(input.packId)
  const serverName = safeMarkdownValue(input.serverName)
  const values = {
    serverName,
    serverNameJson: JSON.stringify(input.serverName).slice(1, -1),
    packId: pack.id,
    packLabel: safeMarkdownValue(pack.label),
    packPurpose: safeMarkdownValue(pack.purpose),
    packTone: safeMarkdownValue(pack.tone),
    enabledWorkflowList: input.enabledWorkflows.length
      ? input.enabledWorkflows.map(workflow => `- ${workflowLabel(workflow)}`).join('\n')
      : '- No external workflow lanes enabled by default.',
    primaryJobList: pack.primaryJobs.map(job => `- ${safeMarkdownValue(job)}`).join('\n'),
    supportChannelJson: JSON.stringify(input.channels?.support ?? '#support').slice(1, -1),
    devChannelJson: JSON.stringify(input.channels?.dev ?? '#dev').slice(1, -1),
    announcementsChannelJson: JSON.stringify(input.channels?.announcements ?? '#announcements').slice(1, -1),
    feedbackChannelJson: JSON.stringify(input.channels?.feedback ?? '#feedback').slice(1, -1),
    moderationChannelJson: JSON.stringify(input.channels?.moderation ?? '#mod-log').slice(1, -1),
  }

  return TARGET_PROFILE_FILES.map(relativePath => ({
    relativePath,
    content: renderTemplate(readSharedTemplate(relativePath), values).trimEnd() + '\n',
  }))
}
