import { describe, expect, test } from 'bun:test'
import {
  TASK_CALENDAR_TERMS,
  buildTaskCalendarRequestShape,
  findMissingTaskCalendarDetails,
  formatReminderDelivery,
  smallestFirstTaskCalendarWorkflow,
  taskCalendarActionPolicy,
  taskCalendarVisibleInScope,
} from '../src/tasks-calendar.ts'

describe('tasks, calendar, and reminders model', () => {
  test('defines reminder, task, calendar, and scheduled-message boundaries', () => {
    expect(TASK_CALENDAR_TERMS.map(term => term.term)).toEqual([
      'reminder',
      'task',
      'calendar_event',
      'scheduled_message',
    ])
    expect(smallestFirstTaskCalendarWorkflow()).toEqual({
      workflow: 'private_reminder',
      reason: 'A single-user reminder needs the fewest shared-permission and invitation rules.',
    })
  })

  test('asks for missing due date/time before creating reminders', () => {
    expect(findMissingTaskCalendarDetails({
      kind: 'reminder',
      title: 'check deploy',
    })).toEqual(['due_at'])

    expect(findMissingTaskCalendarDetails({
      kind: 'reminder',
      title: 'check deploy',
      dueAt: '2026-07-02T09:00:00+07:00',
    })).toEqual([])
  })

  test('requires approval for shared calendar changes and invitations', () => {
    expect(taskCalendarActionPolicy('pending.read')).toEqual({
      risk: 'read',
      approvalRequired: false,
    })

    expect(taskCalendarActionPolicy('calendar.invite')).toEqual({
      risk: 'write',
      approvalRequired: true,
    })
  })

  test('keeps private task visibility scoped to the owner', () => {
    const privateTask = {
      visibility: 'private' as const,
      ownerDiscordUserId: 'user-1',
    }

    expect(taskCalendarVisibleInScope(privateTask, {
      scope: 'private_dm',
      userId: 'user-1',
    })).toBe(true)

    expect(taskCalendarVisibleInScope(privateTask, {
      scope: 'guild_channel',
      userId: 'user-1',
    })).toBe(false)
  })

  test('builds a stable task/calendar request shape with Discord source metadata', () => {
    expect(buildTaskCalendarRequestShape({
      action: 'reminder.create',
      title: 'check deploy',
      dueAt: '2026-07-02T09:00:00+07:00',
      discord: {
        chatId: 'dm-1',
        messageId: 'message-1',
        userId: 'user-1',
        scope: 'private_dm',
      },
    })).toEqual({
      action: 'reminder.create',
      title: 'check deploy',
      due_at: '2026-07-02T09:00:00+07:00',
      discord: {
        chat_id: 'dm-1',
        message_id: 'message-1',
        user_id: 'user-1',
        scope: 'private_dm',
      },
    })
  })

  test('formats due reminder delivery for Discord', () => {
    expect(formatReminderDelivery({
      title: 'check deploy',
      sourceMessageId: 'message-1',
    })).toBe('Reminder due: check deploy (from message message-1)')
  })
})
