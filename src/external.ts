export type ExternalActionRisk = 'read' | 'draft' | 'write' | 'destructive'
export const EXTERNAL_ACTION_RISKS: ExternalActionRisk[] = ['read', 'draft', 'write', 'destructive']

export type ExternalApprovalStatus = 'not_required' | 'pending' | 'approved' | 'denied' | 'expired'

export type ExternalAuditInput = {
  connector: string
  action: string
  risk: ExternalActionRisk
  discordScope: 'private_dm' | 'guild_channel' | 'guild_thread'
  discordUserId: string
  approvalStatus: ExternalApprovalStatus
  target: string
  ok: boolean
  errorKind?: string
}

export function isExternalActionRisk(value: unknown): value is ExternalActionRisk {
  return typeof value === 'string' && (EXTERNAL_ACTION_RISKS as string[]).includes(value)
}

export function externalApprovalRequired(risk: ExternalActionRisk): boolean {
  return risk === 'write' || risk === 'destructive'
}

export function buildExternalAuditFields(input: ExternalAuditInput): Record<string, string> {
  return {
    connector: input.connector,
    action: input.action,
    risk: input.risk,
    discord_scope: input.discordScope,
    discord_user_id: input.discordUserId,
    approval_status: input.approvalStatus,
    target: input.target,
    ok: String(input.ok),
    ...(input.errorKind ? { error_kind: input.errorKind } : {}),
  }
}

export function formatExternalApprovalStatus(status: ExternalApprovalStatus): string {
  const label: Record<ExternalApprovalStatus, string> = {
    not_required: 'External action does not require approval.',
    pending: 'External action approval requested.',
    approved: 'External action approved.',
    denied: 'External action denied.',
    expired: 'External action approval expired.',
  }
  return label[status]
}
