# External Connectors

External connectors let a Discord request read from or act on systems outside
Discord. They must use one shared safety model before any specific integration
adds its own behavior.

Parent issue: #11

## Risk Levels

Every connector action must declare one risk level:

| Risk | Meaning | Approval |
| --- | --- | --- |
| `read` | Reads external data without changing it. | Not required by default. |
| `draft` | Prepares output without publishing or mutating the external system. | Not required by default. |
| `write` | Creates or updates external state. | Required. |
| `destructive` | Deletes, closes, deploys, rolls back, revokes, or otherwise makes a hard-to-reverse change. | Required, with the clearest visible summary. |

Connector config may make approval stricter than this table, but not weaker.

## Approval Rules

Approvals are visible Discord interactions, not hidden prompt text.

- In DMs, the approved DM user can approve their own `write` action.
- In guild channels and threads, approvers must pass the existing channel/thread
  access policy.
- `destructive` actions should be approved by a trusted operator from the
  top-level `allowFrom` list, not just any member of a broad channel policy.
- A Discord message that says "approve this" is not approval. Approval must come
  through the connector approval control.
- Denied or expired approvals must be reported back to the same Discord scope.

## Audit Fields

Every external action attempt should produce an audit event with these fields:

| Field | Meaning |
| --- | --- |
| `connector` | Stable connector id, such as `github` or `webhook`. |
| `action` | Stable action id, such as `issue.comment`. |
| `risk` | `read`, `draft`, `write`, or `destructive`. |
| `discord_scope` | `private_dm`, `guild_channel`, or `guild_thread`. |
| `discord_user_id` | Discord user snowflake that requested or approved the action. |
| `approval_status` | `not_required`, `pending`, `approved`, `denied`, or `expired`. |
| `target` | Redacted target identifier, such as `owner/repo#123`. |
| `ok` | `true` or `false`. |
| `error_kind` | Optional stable failure kind. |

Secrets, tokens, raw request headers, and full external payloads do not belong in
the audit log. Store redacted target identifiers and stable error kinds instead.

## Discord Reporting

Connector results should be short-first in shared channels:

- Read-only results can summarize the useful facts and offer to attach details.
- Draft results should say what was prepared and ask before publishing.
- Write results should name the external target and what changed.
- Destructive results should include the target, approver, and final state.
- Denied approvals should say `External action denied.`
- Expired approvals should say `External action approval expired.`

## Examples

| Request | Risk | Default behavior |
| --- | --- | --- |
| "Find the latest open issue about Discord replies." | `read` | Query and summarize. |
| "Draft a GitHub issue for this bug." | `draft` | Prepare text in Discord; do not publish. |
| "Comment this fix note on issue #123." | `write` | Request approval, then post after approval. |
| "Rollback production to the previous release." | `destructive` | Require explicit trusted-operator approval with a visible target summary. |
