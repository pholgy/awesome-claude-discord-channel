import { externalApprovalRequired, type ExternalActionRisk, type ExternalApprovalStatus } from './external.ts'

export type OperationsAction =
  | 'status.read'
  | 'health.read'
  | 'logs.read'
  | 'version.read'
  | 'config.read'
  | 'deploy.start'
  | 'service.restart'
  | 'deploy.rollback'

export type OperationsActionPolicy = {
  risk: ExternalActionRisk
  approvalRequired: boolean
  trustedApprovalRequired: boolean
}

export type OperationsRequestInput = {
  action: OperationsAction
  target: string
  discord: {
    chatId: string
    messageId: string
    userId: string
    scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  }
}

export function smallestFirstOperationsWorkflow(): { action: OperationsAction; reason: string } {
  return {
    action: 'status.read',
    reason: 'Status readback is useful, provider-neutral, and does not mutate live systems.',
  }
}

export function operationsActionPolicy(action: OperationsAction): OperationsActionPolicy {
  const riskByAction: Record<OperationsAction, ExternalActionRisk> = {
    'status.read': 'read',
    'health.read': 'read',
    'logs.read': 'read',
    'version.read': 'read',
    'config.read': 'read',
    'deploy.start': 'write',
    'service.restart': 'write',
    'deploy.rollback': 'destructive',
  }
  const risk = riskByAction[action]

  return {
    risk,
    approvalRequired: externalApprovalRequired(risk),
    trustedApprovalRequired: risk === 'destructive',
  }
}

export function redactOperationsLogLine(line: string): string {
  return line
    .replace(/Authorization:\s*Bearer\s+\S+/gi, 'Authorization: [redacted]')
    .replace(/\b(token|password|secret|api_key)=\S+/gi, '$1=[redacted]')
}

export function buildOperationsAuditFields(input: {
  action: OperationsAction
  risk: ExternalActionRisk
  target: string
  discordUserId: string
  approvalStatus: ExternalApprovalStatus
  ok: boolean
  provider: string
  errorKind?: string
}): Record<string, string> {
  return {
    connector: 'operations',
    action: input.action,
    risk: input.risk,
    target: input.target,
    discord_user_id: input.discordUserId,
    approval_status: input.approvalStatus,
    ok: String(input.ok),
    provider: input.provider,
    ...(input.errorKind ? { error_kind: input.errorKind } : {}),
  }
}

export function buildOperationsRequestShape(input: OperationsRequestInput): Record<string, unknown> {
  return {
    action: input.action,
    target: input.target,
    discord: {
      chat_id: input.discord.chatId,
      message_id: input.discord.messageId,
      user_id: input.discord.userId,
      scope: input.discord.scope,
    },
  }
}

export function summarizeOperationsCredentialConfig(input: {
  provider: string
  tokenEnvVar: string
}): Record<string, string> {
  return {
    provider: input.provider,
    auth: `token_env:${input.tokenEnvVar}`,
  }
}

export function formatOperationsStatusSummary(input: {
  target: string
  status: string
  version?: string
}): string {
  const version = input.version ? ` (version ${input.version})` : ''
  return `${input.target} status: ${input.status}${version}`
}
