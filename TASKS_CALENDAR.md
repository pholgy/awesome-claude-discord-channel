# Tasks, Calendar, And Reminders

Discord conversations often end with follow-up work: remind me tomorrow, make a
task, schedule this, or ask the group later. This lane defines those workflows
without assuming a specific task or calendar provider.

Parent issue: #11  
Child issue: #15

## Terms

| Term | Meaning |
| --- | --- |
| `reminder` | A time-based notification delivered back to Discord. |
| `task` | A trackable follow-up item owned by a user or shared scope. |
| `calendar_event` | A dated event that may invite people or modify a shared calendar. |
| `scheduled_message` | A Discord message queued for later delivery. |

The smallest first slice is `private_reminder`: a single-user reminder needs the
fewest shared-permission and invitation rules.

## Creation Rules

Claude should not create a reminder, task, event, or scheduled message when
required details are missing.

Required fields:

| Kind | Required details |
| --- | --- |
| `reminder` | title, due date/time |
| `task` | title |
| `calendar_event` | title, due date/time |
| `scheduled_message` | title/message, due date/time |

When a user says "remind me tomorrow" without enough timezone or time detail,
ask for the missing details first instead of guessing.

## Action Policy

| Action | Risk | Default behavior |
| --- | --- | --- |
| `pending.read` | `read` | Summarize pending items for the authorized Discord scope. |
| `reminder.create` | `write` | Create only after visible approval. |
| `task.create` | `write` | Create only after visible approval. |
| `scheduled_message.create` | `write` | Create only after visible approval. |
| `calendar.draft` | `draft` | Draft event details in Discord; do not publish. |
| `calendar.create` | `write` | Modify a calendar only after visible approval. |
| `calendar.invite` | `write` | Invite people only after visible approval. |

Shared calendars and invitations always need explicit approval from the current
Discord scope before they change external state.

## Visibility

| Visibility | Allowed scope |
| --- | --- |
| `private` | Only the owning Discord user's DM. |
| `shared_channel` | The configured guild channel or thread. |
| `shared_guild` | Guild channels or threads in the configured guild. |

Private reminders and tasks must not be summarized into public channels unless
the user explicitly creates a shared item.

## Request Shape

```json
{
  "action": "reminder.create",
  "title": "check deploy",
  "due_at": "2026-07-02T09:00:00+07:00",
  "discord": {
    "chat_id": "123",
    "message_id": "456",
    "user_id": "789",
    "scope": "private_dm"
  }
}
```

## Reminder Delivery

Due reminders should return to the same authorized Discord scope and include the
source message when available:

```text
Reminder due: check deploy (from message 456)
```

If the original channel or thread is no longer authorized, the connector should
fail with a stable authorization error instead of posting elsewhere.
