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
