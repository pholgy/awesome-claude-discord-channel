# Operations, Deploy, And Status

Operations workflows let server owners ask Discord whether a bot or service is
healthy, what version is deployed, what recent logs say, or whether a deploy,
restart, or rollback should happen.

Parent issue: #11
Child issue: #16

This is the riskiest external lane because it can mutate live systems. The first
slice is provider-neutral status readback only.

## Action Policy

| Action | Risk | Default behavior |
| --- | --- | --- |
| `status.read` | `read` | Report current status without approval. |
| `health.read` | `read` | Read health checks without approval. |
| `logs.read` | `read` | Read recent redacted logs without approval. |
| `version.read` | `read` | Report deployed version without approval. |
| `config.read` | `read` | Report redacted config summary without approval. |
| `deploy.start` | `write` | Start deploy only after visible approval. |
| `service.restart` | `write` | Restart only after visible approval. |
| `deploy.rollback` | `destructive` | Roll back only after trusted visible approval. |

The smallest first slice is `status.read`: status readback is useful,
provider-neutral, and does not mutate live systems.

## Credential Configuration

Connector config should name credential bindings, not contain token values:

```json
{
  "provider": "fly",
  "token_env": "FLY_API_TOKEN"
}
```

Discord summaries and audit logs may show `token_env:FLY_API_TOKEN`, but never
the token value.

## Request Shape

```json
{
  "action": "logs.read",
  "target": "bot-prod",
  "discord": {
    "chat_id": "123",
    "message_id": "456",
    "user_id": "789",
    "scope": "guild_thread"
  }
}
```

## Log Redaction

Logs must be redacted before posting into Discord.

Redact common patterns:

- `Authorization: Bearer ...`
- `token=...`
- `password=...`
- `secret=...`
- `api_key=...`

Large logs should be attached or linked after redaction instead of pasted into a
shared channel.

## Audit Fields

Deploy, restart, and rollback attempts need audit fields even when denied or
failed:

| Field | Meaning |
| --- | --- |
| `connector` | Always `operations`. |
| `action` | Stable action id, such as `service.restart`. |
| `risk` | `read`, `write`, or `destructive`. |
| `target` | Redacted service/environment target. |
| `discord_user_id` | Requesting or approving Discord user. |
| `approval_status` | `not_required`, `pending`, `approved`, `denied`, or `expired`. |
| `ok` | `true` or `false`. |
| `provider` | Provider id such as `fly`, `railway`, `dokploy`, or `generic`. |
| `error_kind` | Optional stable failure kind. |

## Discord Status Summary

Status output should be short-first:

```text
bot-prod status: healthy (version 2026.07.01-1)
```

Incident or deploy summaries should move into a thread when they need multiple
updates.
