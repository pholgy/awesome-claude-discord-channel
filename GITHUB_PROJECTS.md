# GitHub And Project Workflows

Discord often becomes the room where issues, PRs, checks, releases, and follow-up
work are discussed. This lane lets Claude move project context between Discord
and GitHub without making hidden changes.

Parent issue: #11  
Child issue: #14

## Action Policy

| Action | Risk | Default behavior |
| --- | --- | --- |
| `issue.read` | `read` | Summarize an issue into Discord. |
| `pr.read` | `read` | Summarize a PR into Discord. |
| `checks.read` | `read` | Report status/check results. |
| `issue.draft` | `draft` | Draft an issue body in Discord; do not publish. |
| `pr_body.draft` | `draft` | Draft PR text in Discord; do not publish. |
| `review_comment.draft` | `draft` | Draft review/comment text in Discord; do not publish. |
| `issue.create` | `write` | Create an issue only after visible approval. |
| `issue.comment` | `write` | Post an issue comment only after visible approval. |
| `pr.review_comment` | `write` | Post a PR review/comment only after visible approval. |
| `issue.close` | `destructive` | Close only after trusted visible approval. |
| `pr.merge` | `destructive` | Merge only after trusted visible approval. |

Read-only actions do not require approval by default. Draft actions prepare text
inside Discord and stop before publication. Write and destructive actions inherit
the approval rules from [EXTERNAL_CONNECTORS.md](./EXTERNAL_CONNECTORS.md).

## Discord Request Shape

```json
{
  "action": "issue.comment",
  "target": "owner/repo#123",
  "body": "Approved summary.",
  "discord": {
    "chat_id": "456",
    "message_id": "789",
    "user_id": "111",
    "scope": "guild_thread"
  }
}
```

## Discord Source Links

Created GitHub issues and comments should link back to the Discord source when
the request came from a guild channel or thread:

```text
Discord source: https://discord.com/channels/<guild>/<channel>/<message>
```

For DMs, avoid publishing a Discord link into a public GitHub issue unless the
user explicitly asks for that context to be copied.

## Status Output

Check output should be short enough to scan in Discord:

```text
owner/repo#123 checks: 1 passed, 1 failed. Failed: verify
```

Large logs, failed test output, or full review bodies should be attached or
linked rather than pasted into a shared channel.

## Auth Configuration

The connector should accept provider-neutral configuration names instead of
hardcoding local paths:

```json
{
  "token_env": "GITHUB_TOKEN",
  "installation_id_env": "GITHUB_APP_INSTALLATION_ID"
}
```

Audit logs and Discord replies must reference the environment binding names, not
the token values.
