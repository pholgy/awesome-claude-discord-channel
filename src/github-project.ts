import { externalApprovalRequired, type ExternalActionRisk } from './external.ts'

export type GitHubProjectAction =
  | 'issue.read'
  | 'pr.read'
  | 'checks.read'
  | 'issue.draft'
  | 'pr_body.draft'
  | 'review_comment.draft'
  | 'issue.create'
  | 'issue.comment'
  | 'pr.review_comment'
  | 'issue.close'
  | 'pr.merge'

export type GitHubProjectActionPolicy = {
  risk: ExternalActionRisk
  approvalRequired: boolean
  draftFirst: boolean
}

export type GitHubCheckConclusion = 'success' | 'failure' | 'cancelled' | 'skipped' | 'pending'

export type GitHubProjectRequestInput = {
  action: GitHubProjectAction
  target: string
  body?: string
  discord: {
    chatId: string
    messageId: string
    userId: string
    scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  }
}

export function githubProjectActionPolicy(action: GitHubProjectAction): GitHubProjectActionPolicy {
  const riskByAction: Record<GitHubProjectAction, ExternalActionRisk> = {
    'issue.read': 'read',
    'pr.read': 'read',
    'checks.read': 'read',
    'issue.draft': 'draft',
    'pr_body.draft': 'draft',
    'review_comment.draft': 'draft',
    'issue.create': 'write',
    'issue.comment': 'write',
    'pr.review_comment': 'write',
    'issue.close': 'destructive',
    'pr.merge': 'destructive',
  }
  const risk = riskByAction[action]

  return {
    risk,
    approvalRequired: externalApprovalRequired(risk),
    draftFirst: risk === 'draft',
  }
}

export function formatDiscordSourceLink(input: {
  guildId: string
  channelId: string
  messageId: string
}): string {
  return `Discord source: https://discord.com/channels/${input.guildId}/${input.channelId}/${input.messageId}`
}

export function formatGitHubChecksSummary(input: {
  target: string
  checks: { name: string; conclusion: GitHubCheckConclusion }[]
}): string {
  const passed = input.checks.filter(check => check.conclusion === 'success').length
  const failedChecks = input.checks.filter(check => check.conclusion === 'failure')
  const failed = failedChecks.length
  const failedSuffix = failed > 0 ? `. Failed: ${failedChecks.map(check => check.name).join(', ')}` : ''

  return `${input.target} checks: ${passed} passed, ${failed} failed${failedSuffix}`
}

export function buildGitHubProjectRequestShape(input: GitHubProjectRequestInput): Record<string, unknown> {
  return {
    action: input.action,
    target: input.target,
    ...(input.body ? { body: input.body } : {}),
    discord: {
      chat_id: input.discord.chatId,
      message_id: input.discord.messageId,
      user_id: input.discord.userId,
      scope: input.discord.scope,
    },
  }
}

export function summarizeGitHubAuthConfig(input: {
  tokenEnvVar: string
  installationIdEnvVar?: string
}): Record<string, string> {
  return {
    auth: `token_env:${input.tokenEnvVar}`,
    ...(input.installationIdEnvVar ? { installation: `env:${input.installationIdEnvVar}` } : {}),
  }
}
