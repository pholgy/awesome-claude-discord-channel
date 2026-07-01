import { externalApprovalRequired, type ExternalActionRisk } from './external.ts'

export type TaskCalendarTerm = 'reminder' | 'task' | 'calendar_event' | 'scheduled_message'

export const TASK_CALENDAR_TERMS: { term: TaskCalendarTerm; meaning: string }[] = [
  { term: 'reminder', meaning: 'A time-based notification delivered back to Discord.' },
  { term: 'task', meaning: 'A trackable follow-up item owned by a user or shared scope.' },
  { term: 'calendar_event', meaning: 'A dated event that may invite people or modify a shared calendar.' },
  { term: 'scheduled_message', meaning: 'A Discord message queued for later delivery.' },
]

export type TaskCalendarAction =
  | 'pending.read'
  | 'reminder.create'
  | 'task.create'
  | 'scheduled_message.create'
  | 'calendar.draft'
  | 'calendar.create'
  | 'calendar.invite'

export type TaskCalendarActionPolicy = {
  risk: ExternalActionRisk
  approvalRequired: boolean
}

export type TaskCalendarWorkflow = 'private_reminder' | 'private_task' | 'shared_task' | 'shared_calendar_event'

export type TaskCalendarRequestInput = {
  action: TaskCalendarAction
  title: string
  dueAt?: string
  discord: {
    chatId: string
    messageId: string
    userId: string
    scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  }
}

export type TaskCalendarVisibility =
  | {
      visibility: 'private'
      ownerDiscordUserId: string
    }
  | {
      visibility: 'shared_channel'
      chatId: string
    }
  | {
      visibility: 'shared_guild'
      guildId: string
    }

export type TaskCalendarDiscordScope = {
  scope: 'private_dm' | 'guild_channel' | 'guild_thread'
  userId: string
  chatId?: string
  guildId?: string
}

export function smallestFirstTaskCalendarWorkflow(): { workflow: TaskCalendarWorkflow; reason: string } {
  return {
    workflow: 'private_reminder',
    reason: 'A single-user reminder needs the fewest shared-permission and invitation rules.',
  }
}

export function findMissingTaskCalendarDetails(input: {
  kind: TaskCalendarTerm
  title?: string
  dueAt?: string
}): string[] {
  const missing: string[] = []

  if (!input.title) {
    missing.push('title')
  }

  if (input.kind === 'reminder' || input.kind === 'calendar_event' || input.kind === 'scheduled_message') {
    if (!input.dueAt) {
      missing.push('due_at')
    }
  }

  return missing
}

export function taskCalendarActionPolicy(action: TaskCalendarAction): TaskCalendarActionPolicy {
  const riskByAction: Record<TaskCalendarAction, ExternalActionRisk> = {
    'pending.read': 'read',
    'reminder.create': 'write',
    'task.create': 'write',
    'scheduled_message.create': 'write',
    'calendar.draft': 'draft',
    'calendar.create': 'write',
    'calendar.invite': 'write',
  }
  const risk = riskByAction[action]

  return {
    risk,
    approvalRequired: externalApprovalRequired(risk),
  }
}

export function taskCalendarVisibleInScope(
  item: TaskCalendarVisibility,
  discord: TaskCalendarDiscordScope,
): boolean {
  if (item.visibility === 'private') {
    return discord.scope === 'private_dm' && discord.userId === item.ownerDiscordUserId
  }

  if (item.visibility === 'shared_channel') {
    return discord.scope !== 'private_dm' && discord.chatId === item.chatId
  }

  return discord.scope !== 'private_dm' && discord.guildId === item.guildId
}

export function buildTaskCalendarRequestShape(input: TaskCalendarRequestInput): Record<string, unknown> {
  return {
    action: input.action,
    title: input.title,
    ...(input.dueAt ? { due_at: input.dueAt } : {}),
    discord: {
      chat_id: input.discord.chatId,
      message_id: input.discord.messageId,
      user_id: input.discord.userId,
      scope: input.discord.scope,
    },
  }
}

export function formatReminderDelivery(input: {
  title: string
  sourceMessageId: string
}): string {
  return `Reminder due: ${input.title} (from message ${input.sourceMessageId})`
}
