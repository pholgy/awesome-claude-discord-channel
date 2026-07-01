# Files, Media, And Artifacts

Files are a Discord-native workflow: users upload screenshots, PDFs, logs, CSVs,
and reports, then expect useful output back in the same channel or thread.

Parent issue: #11  
Child issue: #17

This document defines the first file/media lane without adding a live storage
backend. The goal is to make limits, delivery, and sensitive-output behavior
explicit before attaching external storage or processors.

## Accepted Workflows

First supported workflows:

| Workflow | Meaning |
| --- | --- |
| `ingest_attachment` | Accept a Discord attachment into a controlled processing inbox. |
| `summarize_file` | Produce a short text summary of an uploaded file. |
| `transform_file` | Convert or redact an uploaded file into a new artifact. |
| `generate_artifact` | Create a file such as a report, transcript, or export. |
| `store_artifact` | Store an artifact behind an authorized external link. |

The smallest first slice is `ingest_attachment`: Discord attachments are already
available to the channel and need limits before external storage.

## Limits

First-slice limits:

| Limit | Value |
| --- | --- |
| Maximum file size | 25 MiB |
| Accepted text types | `text/plain`, `text/markdown`, `text/csv`, `application/json` |
| Accepted media/document types | `image/png`, `image/jpeg`, `application/pdf` |
| Unsupported examples | executables, archives, raw cookies, private keys |

Unsupported or oversized files should fail before processing with a stable
reason such as `unsupported_type` or `too_large`.

## Discord Request Shape

```json
{
  "workflow": "summarize_file",
  "attachment_id": "123",
  "filename": "incident-log.txt",
  "discord": {
    "chat_id": "456",
    "message_id": "789",
    "user_id": "111",
    "scope": "guild_thread"
  }
}
```

The Discord origin metadata lets processors audit where the file came from and
where the result is allowed to return.

## Reply Delivery

Use Discord text for small text artifacts only. Use an attachment when:

- output is binary,
- output text is longer than the normal Discord reply budget,
- the result is meant to be downloaded,
- a summary is short but the full output is larger.

Shared channels should receive a short summary first, then the attachment or
authorized link.

## Sensitive Files

Sensitivity levels:

| Sensitivity | Behavior |
| --- | --- |
| `public` | May be returned to the current authorized Discord scope. |
| `internal` | May be returned to DMs or explicitly authorized shared scopes. |
| `secret` | Block from shared channels and threads; prefer DM-only handling. |

Generated output must be blocked or redacted before reposting if it contains
tokens, cookies, passwords, private keys, or unapproved personal data.

## External Storage Links

External artifact links should be:

- authorized for the current Discord scope,
- short-lived by default,
- scoped to the artifact instead of a broad bucket or folder,
- safe to revoke independently.

Discord summaries should say whether a link was authorized and when it expires.

## Examples

Upload -> summarize -> reply:

1. A user uploads `incident-log.txt` in a thread.
2. Claude accepts the attachment if size and type checks pass.
3. Claude posts a short summary to the thread.
4. Claude attaches the full generated report only if the output is too long for
   a normal Discord reply.

Upload -> redact -> reply:

1. A user uploads a JSON export in a shared channel.
2. The processor detects secrets in the generated output.
3. Claude blocks the shared-channel repost and asks whether to continue in DM.
