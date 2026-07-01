# Knowledge Sources

Knowledge sources let Claude answer Discord questions from selected external
material without turning every answer into a channel flood or mixing private
sources into public conversation.

Parent issue: #11  
Child issue: #13

This lane is read-only by default. It can cite, summarize, refresh, and explain
sources, but it should not mutate docs, wikis, files, or websites.

## Source Types

First supported source types:

| Type | Read-only | Examples |
| --- | --- | --- |
| `local_docs` | yes | README files, repo docs, runbooks |
| `repo_file` | yes | source files, config files, test files |
| `discord_pin` | yes | pinned decisions, channel notes |
| `web_page` | yes | public docs, status pages |
| `drive_file` | yes | shared docs, spreadsheets |
| `notion_page` | yes | team wiki pages, project notes |

The smallest first connector is `local_docs`: provider-neutral docs and runbooks
can be searched without external account setup.

## Discord Request Shape

Users should be able to ask for source-backed answers from the same place they
are already discussing the work:

- "answer from the runbook"
- "summarize this linked page"
- "what did the pinned decision say?"
- "refresh the docs source and answer again"

The connector request should carry Discord origin metadata:

```json
{
  "query": "what did we decide about visible replies?",
  "source_ids": ["runbook"],
  "discord": {
    "chat_id": "123",
    "message_id": "456",
    "user_id": "789",
    "scope": "guild_thread"
  }
}
```

## Citation Behavior

Discord replies should cite sources without dumping raw source content:

- Include a short answer first.
- Add compact citations such as `Sources: [1] README.md, [2] SPEC.md`.
- Limit inline citations in shared channels and offer an attachment for longer
  source lists.
- Do not quote private or restricted source text into a public channel unless
  that source is authorized for the current Discord scope.

## Context Isolation

Source visibility is separate from connector risk:

| Visibility | Allowed scope |
| --- | --- |
| `private_dm` | Only the owning Discord user's DM. |
| `channel_shared` | Only the configured channel or thread. |
| `server_shared` | Guild channels or threads in the configured guild. |

Private DM sources must not be used to answer in guild channels or threads.
Server-shared sources must not be used in DMs unless explicitly copied into a
DM-authorized source.

## Failure Behavior

Use stable failure kinds so Discord users can tell what happened:

| Failure kind | Discord wording |
| --- | --- |
| `unauthorized` | `Source unavailable: not authorized for this Discord scope.` |
| `source_unavailable` | `Source unavailable: connector could not read it.` |
| `not_found` | `Source unavailable: no matching source found.` |
| `stale_source` | `Source unavailable: refresh required before answering.` |
| `source_too_large` | `Source unavailable: too large for the current connector.` |

Do not answer from memory when the user explicitly asked for a source-backed
answer and the source is unavailable.
