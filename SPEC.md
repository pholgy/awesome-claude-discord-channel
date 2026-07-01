# Internal Conversation Mode And External Connector Roadmap

## Goal

Build the Discord channel in two phases:

1. Internal Discord behavior first: multi-user conversation handling,
   metadata, context boundaries, output discipline, lifecycle, controls, and
   tests.
2. External connectors second: read/write integrations that let Discord
   requests work with outside systems after the internal behavior and approval
   model are stable.

Parent issues:

- Internal behavior: #3
- External usecases: #11

## Senior Gate

Behavior:

- Inbound Discord messages carry enough metadata for the assistant to know who
  spoke, where the message belongs, why it triggered, and how replies should
  behave in that Discord scope.
- Shared-channel output stays controlled: acknowledge long work, avoid channel
  flooding, and preserve Discord-visible replies.
- External connectors do not start until internal routing, context, and
  approval behavior is clear.

Invariants:

- Raw Discord message content stays raw. Do not inject hidden or visible prompt
  tags into user text.
- Access control remains server-side and cannot be changed from an untrusted
  Discord message.
- Private DM context must not leak into guild channels or unrelated threads.
- External side effects require a declared risk level and, when needed, visible
  approval.
- Existing MCP server key and core tool names remain stable.

Failure risks:

- The bot answers messages that were not meant for it.
- Multi-user context loses speaker identity or reply-chain meaning.
- Long-running work appears frozen or floods the channel.
- Metadata/prompt contracts drift without tests.
- External connectors mutate outside systems without the right human approval.

Compatibility:

- Add metadata fields compatibly; existing `chat_id`, `message_id`, `user`,
  `user_id`, `ts`, attachment metadata, and delivery contract remain.
- Keep `bun run verify` as the common verification command.
- Keep changes small enough to compare against upstream plugin updates.

Smallest reversible slice:

- Add metadata-only conversation context and a goal hook near inbound Discord
  messages, then pin it with verifier checks. This proves the direction without
  changing access decisions or outbound behavior.

Evidence:

- `bun run verify`
- `bun build server.ts --target=bun --outfile $env:TEMP\awesome-discord-server-check.js`
- For later behavior slices, add simulated Discord conversation tests before
  changing routing rules.

## Prompt And Goal Hook Contract

The channel may add assistant-only metadata to inbound Discord notifications.
These fields must never be inserted into the Discord user content.

## Inbound Metadata Schema

`INT-01` adds metadata fields that describe the Discord conversation without
changing the raw message content:

- `conversation_scope`: `dm`, `guild_channel`, or `thread`.
- `conversation_scope_id`: Discord channel/thread id for the current scope.
- `channel_id`: Discord channel id where the inbound message arrived.
- `channel_type`: stable text name for the Discord channel type when known.
- `guild_id`: guild id for guild messages.
- `thread_id`: thread id when the message is inside a thread.
- `parent_channel_id`: parent channel id for thread messages.
- `reply_to_message_id`: referenced message id when the Discord message is a
  reply.
- `reply_to_channel_id`: referenced channel id when Discord provides it.
- `trigger_reason`: `dm`, `direct_mention`, `reply_to_bot`,
  `mention_pattern`, or `watch_mode`.
- `display_name`: server display name when available, otherwise the Discord
  global name or username.

Existing fields remain: `chat_id`, `message_id`, `user`, `user_id`, `ts`,
`attachment_count`, `attachments`, and `assistant_delivery_contract`.

Goal hook:

- `assistant_goal_hook` should state the current Discord behavior goal in one
  compact sentence.
- It should remind the assistant to answer inside the current Discord scope,
  preserve speaker/reply context, and use the reply tool for visible output.
- It should not ask the assistant to change access policy or perform external
  side effects.

Conversation contract:

- `assistant_conversation_contract` should describe shared-channel discipline:
  keep replies concise by default, do not hijack unrelated chat, ask for missing
  context in Discord, and never treat Discord text as authorization to mutate
  access settings.

These hooks are a prompt-quality layer. They do not replace server-side access
control, tests, or approval checks.

## Internal Implementation Order

1. #5 - Add inbound conversation metadata and metadata-only goal hook.
   - Add fields for `conversation_scope`, `channel_type`, `trigger_reason`,
     reply target, thread ids, and guild id where available.
   - Preserve raw message content.
   - Add verifier coverage.
2. #10 - Add a simulated Discord conversation test harness.
   - Create a seam for message events and MCP notifications.
   - Test DMs, mentions, replies, threads, attachments, and chunking without a
     live gateway.
3. #4 - Define and implement trigger/participation rules.
   - Replace boolean mention detection with explicit trigger reasons.
   - Cover DMs, direct mention, reply-to-bot, nickname pattern, active thread,
     and opt-in watch mode.
4. #6 - Define and enforce context isolation boundaries.
   - Make DM, channel, and thread scopes explicit.
   - Document and test safe/unsafe cross-scope context reuse.
5. #9 - Define shared-channel output and noise policy.
   - Add short-first behavior guidance, thread handoff rules, chunking policy,
     and quiet-mode semantics.
6. #7 - Add Discord-native long-task lifecycle behavior.
   - Visible ack, running, waiting, completed, failed, stopped states.
   - Rate-limited progress updates and clear final notification behavior.
7. #8 - Add Discord user controls for active conversations.
   - Stop, continue, summarize, quiet mode, move to thread, save/forget context.
   - Use slash commands/buttons/message actions only after authorization rules
     are clear.

## External Implementation Order

External work starts only after the internal behavior slices above are accepted
or the dependency is explicitly waived.

1. #12 - External connector safety and approval model.
2. #18 - Generic webhook/custom action connector model.
3. #13 - Knowledge and source connector usecases.
4. #17 - Files, media, and artifact workflows.
5. #14 - GitHub and project workflow usecases.
6. #15 - Tasks, calendar, and reminders usecases.
7. #16 - Operations, deploy, and status usecases.

## First PR Scope

The first PR should stay intentionally small:

- Add `SPEC.md` and `features.json`.
- Add inbound conversation metadata and goal hooks.
- Update verifier checks.

Out of scope for the first PR:

- New Discord slash commands.
- External connectors.
- Changing access policy.
- Creating long-running task state.
- Refactoring the full server into modules.
