import { externalApprovalRequired, type ExternalActionRisk } from './external.ts'

export type CustomActionMethod = 'GET' | 'POST'
export type CustomActionRetry = 'none' | 'safe-read-once'

export type CustomActionConfigInput = {
  id: string
  name: string
  url: string
  method: CustomActionMethod
  risk: ExternalActionRisk
  approval_required?: boolean
  timeout_ms?: number
  retry?: CustomActionRetry
}

export type CustomActionConfig = {
  id: string
  name: string
  url: string
  method: CustomActionMethod
  risk: ExternalActionRisk
  approval_required: boolean
  timeout_ms: number
  retry: CustomActionRetry
}

export type CustomActionRequestInput = {
  actionId: string
  input: Record<string, unknown>
  discord: {
    chatId: string
    messageId: string
    userId: string
    scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  }
}

export function customActionApprovalRequired(
  input: Pick<CustomActionConfigInput, 'risk' | 'approval_required'>,
): boolean {
  return externalApprovalRequired(input.risk) || input.approval_required === true
}

export function normalizeCustomActionConfig(input: CustomActionConfigInput): CustomActionConfig {
  return {
    id: input.id,
    name: input.name,
    url: input.url,
    method: input.method,
    risk: input.risk,
    approval_required: customActionApprovalRequired(input),
    timeout_ms: input.timeout_ms ?? 30000,
    retry: input.retry ?? 'none',
  }
}

export function buildCustomActionRequestShape(input: CustomActionRequestInput): Record<string, unknown> {
  return {
    action_id: input.actionId,
    input: input.input,
    discord: {
      chat_id: input.discord.chatId,
      message_id: input.discord.messageId,
      user_id: input.discord.userId,
      scope: input.discord.scope,
    },
  }
}

export function redactCustomActionHeaders(headers: Record<string, string>): Record<string, string> {
  const secretHeader = /^(authorization|proxy-authorization|x-api-key|api-key|cookie|set-cookie)$/i
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, secretHeader.test(key) ? '[redacted]' : value]),
  )
}
