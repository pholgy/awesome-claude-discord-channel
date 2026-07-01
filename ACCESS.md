# Discord — Access & Delivery

Discord only allows DMs between accounts that share a server. Who can DM your bot depends on where it's installed: one private server means only that server's members can reach it; a public community means every member there can open a DM.

The **Public Bot** toggle in the Developer Portal (Bot tab, on by default) controls who can add the bot to new servers. Turn it off and only your own account can install it. This is your first gate, and it's enforced by Discord rather than by this process.

For DMs that do get through, the default policy is **pairing**. An unknown sender gets a 6-character code in reply and their message is dropped. You run `/discord:access pair <code>` from your assistant session to approve them. Once approved, their messages pass through.

All state lives in `~/.claude/channels/discord/access.json`. The `/discord:access` skill commands edit this file; the server re-reads it on every inbound message, so changes take effect without a restart. Set `DISCORD_ACCESS_MODE=static` to pin config to what was on disk at boot (pairing is unavailable in static mode since it requires runtime writes).

## At a glance

| | |
| --- | --- |
| Default policy | `pairing` |
| Sender ID | User snowflake (numeric, e.g. `184695080709324800`) |
| Group key | Channel snowflake — not guild ID |
| Config file | `~/.claude/channels/discord/access.json` |

## DM policies

`dmPolicy` controls how DMs from senders not on the allowlist are handled.

| Policy | Behavior |
| --- | --- |
| `pairing` (default) | Reply with a pairing code, drop the message. Approve with `/discord:access pair <code>`. |
| `allowlist` | Drop silently. No reply. Use this once everyone who needs access is already on the list, or if pairing replies would attract spam. |
| `disabled` | Drop everything, including allowlisted users and guild channels. |

```
/discord:access policy allowlist
```

## User IDs

Discord identifies users by **snowflakes**: permanent numeric IDs like `184695080709324800`. Usernames are mutable; snowflakes aren't. The allowlist stores snowflakes.

Pairing captures the ID automatically. To add someone manually, enable **User Settings → Advanced → Developer Mode** in Discord, then right-click any user and choose **Copy User ID**. Your own ID is available by right-clicking your avatar in the lower-left.

```
/discord:access allow 184695080709324800
/discord:access remove 184695080709324800
```

## Guild channels

Guild channels are off by default. Opt each one in individually, keyed on the **channel** snowflake (not the guild). Threads inherit their parent channel's opt-in; no separate entry needed. Find channel IDs the same way as user IDs: Developer Mode, right-click the channel, Copy Channel ID.

```
/discord:access group add 846209781206941736
```

With the default `requireMention: true`, the bot responds only when @mentioned or replied to. Pass `--no-mention` to process every message in the channel, or `--allow id1,id2` to restrict which members can trigger it.

```
/discord:access group add 846209781206941736 --no-mention
/discord:access group add 846209781206941736 --allow 184695080709324800,221773638772129792
/discord:access group rm 846209781206941736
```

## Mention detection

In channels with `requireMention: true`, any of the following triggers the bot:

- A structured `@botname` mention (typed via Discord's autocomplete)
- A reply to one of the bot's recent messages
- A match against any regex in `mentionPatterns`
- A message in a thread where the bot has recently replied

Example regex setup for a nickname trigger:

```
/discord:access set mentionPatterns '["^hey claude\\b", "\\bassistant\\b"]'
```

## Trigger reasons

Delivered Discord messages include `trigger_reason` metadata so Claude can tell
why the message reached it:

| Reason | Meaning |
| --- | --- |
| `dm` | Approved direct message. |
| `direct_mention` | Guild message directly mentioned the bot. |
| `reply_to_bot` | Guild message replied to a recent bot message. |
| `mention_pattern` | Guild message matched a configured nickname/regex pattern. |
| `active_thread` | Thread message continued a thread where the bot recently replied. |
| `watch_mode` | Channel was configured with `--no-mention`, so every allowed message is processed. |

The bot stays silent in guild channels that are not enabled, from senders not
allowed by that channel policy, and for unaddressed messages when
`requireMention` is enabled. Discord messages cannot approve pairings or edit
access policy; those changes still have to come from the local `/discord:access`
skill.

Examples:

| Message | Channel setup | Result |
| --- | --- | --- |
| `@bot summarize the deploy logs` | enabled channel, `requireMention: true` | delivered as `direct_mention` |
| Replying to the bot's previous message with `yes, keep going` | enabled channel, `requireMention: true` | delivered as `reply_to_bot` |
| `hey assistant check this diff` | enabled channel with `^hey assistant\\b` in `mentionPatterns` | delivered as `mention_pattern` |
| `this deploy looks broken` | enabled channel, `requireMention: true` | ignored unless it is in an active bot thread |
| `this deploy looks broken` | enabled channel, `--no-mention` | delivered as `watch_mode` |
| Any message from a user outside the channel `allowFrom` list | restricted channel | ignored |

## Context boundaries

Delivered Discord messages include context metadata:

| Field | Values |
| --- | --- |
| `conversation_scope` | `dm`, `guild_channel`, `thread` |
| `context_boundary` | `private_dm`, `guild_channel`, `guild_thread` |
| `context_visibility` | `private`, `shared` |

The intended boundary is strict:

- DMs are private. DM context should not appear in guild channels unless the
  user explicitly asks to move or summarize it.
- Guild channels are shared. The bot should answer from the current channel
  context and ask when it needs missing background.
- Threads are scoped to the thread. A thread may point back to its parent
  channel, but parent-channel history is not automatically the same context.
- `fetch_messages` is a scoped lookback tool. It can provide evidence for the
  current answer, but it is not durable memory.

Safe context reuse examples:

| Situation | Safe behavior |
| --- | --- |
| A user asks in a DM, then later asks in a guild channel | Do not reveal or rely on the DM unless the user explicitly asks to bring that content over. |
| A thread asks about the parent channel discussion | Fetch the relevant parent/channel window or ask for the missing link; say when the fetched window is incomplete. |
| A channel message asks about a thread | Treat the thread as separate context unless the user links or names the thread. |

Unsafe context reuse examples:

| Situation | Unsafe behavior |
| --- | --- |
| Answering a guild channel using private DM details without consent | Leaks private context into shared space. |
| Treating all messages in a busy channel as one task | Mixes unrelated speakers and intents. |
| Assuming fetched history is durable memory | Makes later answers depend on context that may not have been fetched this turn. |

## Delivery

Configure outbound behavior with `/discord:access set <key> <value>`.

**`ackReaction`** reacts to inbound messages on receipt as a "seen" acknowledgment. Unicode emoji work directly; custom server emoji require the full `<:name:id>` form. The emoji ID is at the end of the URL when you right-click the emoji and copy its link. Empty string disables.

```
/discord:access set ackReaction 🔨
/discord:access set ackReaction ""
```

**`replyToMode`** controls threading on chunked replies. When a long response is split, `first` (default) threads only the first chunk under the inbound message; `all` threads every chunk; `off` sends all chunks standalone.

**`textChunkLimit`** sets the split threshold. Discord rejects messages over 2000 characters, which is the hard ceiling.

**`chunkMode`** chooses the split strategy: `length` cuts exactly at the limit; `newline` prefers paragraph boundaries.

## Output policy

Delivered Discord messages include `output_profile` metadata:

| Profile | Intended behavior |
| --- | --- |
| `private_dm` | More conversational replies are acceptable, while still using Discord-visible replies. |
| `shared_channel` | Answer short first, avoid flooding, and move large detail to a thread or attachment when possible. |
| `shared_thread` | More detail is acceptable than in a channel, but progress updates should still be restrained. |

For long work, the assistant should acknowledge early, prefer editing progress
messages instead of posting repeated updates, and send a final new reply when
work completes so Discord users get a notification. Large generated output
should be attached as a file instead of pasted into the channel.

Shared-channel output examples:

| Better | Worse |
| --- | --- |
| `I will check that and post a short result here.` followed by an edited status message | Posting every internal step as a new channel message |
| A short answer plus an attached log or patch file | Pasting thousands of lines into the channel |
| Asking one clarifying question when channel context is missing | Guessing from unrelated earlier messages |
| Sending a new final reply after a long task completes | Only editing an old status message, which may not notify the user |

## Task lifecycle

The channel exposes a `task_status` tool for visible task updates:

| Status | Use |
| --- | --- |
| `acknowledged` | The request was received. |
| `running` | Work is in progress. |
| `waiting` | The task needs permission or user input. |
| `completed` | Work finished. |
| `failed` | Work failed with a useful explanation. |
| `stopped` | Work was cancelled or intentionally stopped. |

`task_status` can send a new status message or edit a previous status message
when `message_id` is provided. Final answers should still use `reply`, because
edited messages do not trigger Discord push notifications.

Active task status messages include Discord buttons:

| Button | Effect |
| --- | --- |
| Stop | Sends a `stop` control request into the current conversation scope. |
| Continue | Sends a `continue` control request into the current conversation scope. |
| Summarize | Sends a `summarize` control request into the current conversation scope. |
| Quiet | Sends a `quiet` control request for the active task. The assistant should stop routine progress updates and reserve visible output for blockers and the final result. |

Button clicks use the same access boundary as inbound messages: approved DMs,
or enabled guild channels/threads where the clicking user is allowed by that
channel policy. Terminal status edits (`completed`, `failed`, `stopped`) remove
the buttons. If someone clicks an old button after the task is no longer active,
the bot replies ephemerally with `No active task for this control.` and does not
notify the assistant.

## Skill reference

| Command | Effect |
| --- | --- |
| `/discord:access` | Print current state: policy, allowlist, pending pairings, enabled channels. |
| `/discord:access pair a4f91c` | Approve pairing code `a4f91c`. Adds the sender to `allowFrom` and sends a confirmation on Discord. |
| `/discord:access deny a4f91c` | Discard a pending code. The sender is not notified. |
| `/discord:access allow 184695080709324800` | Add a user snowflake directly. |
| `/discord:access remove 184695080709324800` | Remove from the allowlist. |
| `/discord:access policy allowlist` | Set `dmPolicy`. Values: `pairing`, `allowlist`, `disabled`. |
| `/discord:access group add 846209781206941736` | Enable a guild channel. Flags: `--no-mention`, `--allow id1,id2`. |
| `/discord:access group rm 846209781206941736` | Disable a guild channel. |
| `/discord:access set ackReaction 🔨` | Set a config key: `ackReaction`, `replyToMode`, `textChunkLimit`, `chunkMode`, `mentionPatterns`. |

## Config file

`~/.claude/channels/discord/access.json`. Absent file is equivalent to `pairing` policy with empty lists, so the first DM triggers pairing.

```jsonc
{
  // Handling for DMs from senders not in allowFrom.
  "dmPolicy": "pairing",

  // User snowflakes allowed to DM.
  "allowFrom": ["184695080709324800"],

  // Guild channels the bot is active in. Empty object = DM-only.
  "groups": {
    "846209781206941736": {
      // true: respond only to @mentions and replies.
      "requireMention": true,
      // Restrict triggers to these senders. Empty = any member (subject to requireMention).
      "allowFrom": []
    }
  },

  // Case-insensitive regexes that count as a mention.
  "mentionPatterns": ["^hey claude\\b"],

  // Reaction on receipt. Empty string disables.
  "ackReaction": "👀",

  // Threading on chunked replies: first | all | off
  "replyToMode": "first",

  // Split threshold. Discord rejects > 2000.
  "textChunkLimit": 2000,

  // length = cut at limit. newline = prefer paragraph boundaries.
  "chunkMode": "newline"
}
```
