# Custom Actions

Custom actions let a server owner wire a named Discord workflow to their own
webhook or script without adding a first-party connector for every service.

Parent issue: #11  
Child issue: #18

Custom actions are not an escape hatch around the external connector safety
model. Every action declares a risk level and inherits the approval rules from
[EXTERNAL_CONNECTORS.md](./EXTERNAL_CONNECTORS.md).

## Config Shape

```jsonc
{
  "id": "github-comment",
  "name": "GitHub comment",
  "url": "https://example.test/actions/github-comment",
  "method": "POST",
  "risk": "write",
  "approval_required": true,
  "timeout_ms": 30000,
  "retry": "none"
}
```

Fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable action id used in audit logs. |
| `name` | yes | Human-readable action name for Discord summaries. |
| `url` | yes | HTTPS endpoint owned by the server operator. |
| `method` | yes | `GET` or `POST`. |
| `risk` | yes | `read`, `draft`, `write`, or `destructive`. |
| `approval_required` | no | Can make approval stricter; cannot weaken risk policy. |
| `timeout_ms` | no | Defaults to `30000`. |
| `retry` | no | `none` or `safe-read-once`. Mutating actions should not retry automatically. |

## Request Shape

```json
{
  "action_id": "deploy-status",
  "input": {
    "service": "api"
  },
  "discord": {
    "chat_id": "123",
    "message_id": "456",
    "user_id": "789",
    "scope": "guild_channel"
  }
}
```

The `input` object is action-specific. The `discord` object is always present so
the receiving service can audit where the request came from.

## Response Shape

```json
{
  "ok": true,
  "summary": "Deployment api is healthy.",
  "details_url": "https://example.test/runs/123"
}
```

Rules:

- `summary` is the short Discord-facing result.
- `details_url` is optional and should not expose secrets.
- Failures should return a stable error kind when possible.
- Large outputs should be written as artifacts by a later file/media connector,
  not pasted into Discord by the custom action itself.

## Secret Handling

Secrets live outside action config. The action config may name a secret binding,
but it should not contain tokens, passwords, cookies, or private keys.

Headers treated as secret in logs and audit output:

- `Authorization`
- `Proxy-Authorization`
- `X-API-Key`
- `API-Key`
- `Cookie`
- `Set-Cookie`

## Timeout, Retry, And Failure

- Default timeout is 30 seconds.
- `read` actions may use `safe-read-once` retry.
- `draft`, `write`, and `destructive` actions should not retry automatically.
- Timeout, denied approval, expired approval, validation failure, and connector
  failure should be distinct failure kinds.

## Discord Summary

Discord should see:

- the action name,
- the target,
- whether approval was required,
- whether it ran,
- the short result or stable failure kind.

Do not dump raw webhook payloads into shared channels.
