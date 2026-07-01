# Community Setup Packs Design

## Goal

Make this Discord channel useful for real communities without requiring each
operator to invent their own Claude behavior profile from scratch.

Community Setup Packs are a first-run setup layer: a user chooses a community
type, answers a few local questions, and receives editable profile files for how
Claude should behave in that Discord server.

This is not a runtime profile engine yet. Version 1 generates files that humans
can inspect, edit, commit, and deploy with the bot.

## Non-Goals

- No live per-server profile database.
- No automatic Discord channel discovery.
- No mutation of Discord permissions or access policy.
- No secrets written into generated files.
- No external provider executors.
- No replacement for `ACCESS.md` or the existing approval model.

## User Experience

The operator runs:

```sh
bun run setup:community
```

The setup asks:

- community type,
- server/community name,
- main channel names or ids,
- whether GitHub, docs/source, files/artifacts, tasks/calendar, and operations
  workflows should be referenced,
- output directory, defaulting to `./community-profile/`.

The command writes a local profile folder:

```text
community-profile/
  CLAUDE.community.md
  channels.example.json
  workflows.md
  moderation.md
  .env.example
```

The user can copy, edit, or commit those files as part of their deployment.

## First Packs

### Project Dev

For open-source or product-building communities.

Primary jobs:

- answer contributor questions from docs,
- draft GitHub issues from Discord discussions,
- summarize PRs and check results,
- explain releases and known problems,
- route bug reports into structured follow-up.

Default style: technical, concise, citation-forward, careful about writes.

### Support Community

For communities where users ask for help, troubleshooting, account/product
guidance, or setup advice.

Primary jobs:

- ask for missing details,
- summarize support threads,
- identify solved answers,
- suggest escalation when the bot cannot safely answer,
- keep shared-channel replies short and non-spammy.

Default style: calm, diagnostic, structured.

### General Community

For broader social or creator communities.

Primary jobs:

- welcome and orient new members,
- summarize long discussions,
- draft announcements,
- support event and reminder workflows,
- help moderators de-escalate without pretending to be a moderator.

Default style: friendly, bounded, community-aware.

## Generated Files

### `CLAUDE.community.md`

The main behavior profile for Claude in this server.

It should include:

- community purpose,
- tone and response boundaries,
- channel-specific behavior,
- allowed and disallowed workflow categories,
- how to use source-backed answers,
- how to acknowledge long work,
- when to ask a human moderator/admin.

It must not include secrets, private tokens, or invisible prompt tricks.

### `channels.example.json`

Editable channel mapping:

```json
{
  "server_name": "Example Community",
  "channels": {
    "support": "#support",
    "dev": "#dev",
    "announcements": "#announcements",
    "feedback": "#feedback",
    "moderation": "#mod-log"
  }
}
```

This file is descriptive in v1. The bot does not automatically load it at
runtime.

### `workflows.md`

Human-readable workflow templates:

- summarize this thread,
- draft an issue,
- answer from docs,
- create a weekly recap,
- triage a support request,
- prepare an announcement,
- ask for missing bug-report details.

Each workflow should include:

- when to use it,
- expected user input,
- assistant behavior,
- visible Discord output shape,
- approval requirement if external state may change.

### `moderation.md`

Community safety and escalation guidance.

It should help Claude:

- avoid acting as an undisclosed moderator,
- distinguish support from moderation,
- de-escalate heated threads,
- suggest moderator escalation for policy, abuse, spam, or private account
  issues,
- avoid public exposure of private details.

### `.env.example`

Deployment/runtime knobs only.

Examples:

```text
DISCORD_BOT_TOKEN=
DISCORD_ACCESS_MODE=
CLAUDE_AUTO_UPDATE=true
CLAUDE_UPDATE_TIMEOUT=60
COMMUNITY_PROFILE_DIR=./community-profile
```

No generated file should contain real credentials.

## Setup Command Architecture

Add a small Bun script:

```text
scripts/setup-community.mjs
```

`package.json` exposes:

```json
{
  "scripts": {
    "setup:community": "bun scripts/setup-community.mjs"
  }
}
```

The script should:

1. present supported packs,
2. collect simple answers from stdin,
3. create the output directory,
4. render template files,
5. refuse to overwrite existing files unless the user confirms,
6. print the next steps.

The renderer can be simple string interpolation. No new template dependency is
needed for v1.

## Template Layout

Store source templates under:

```text
templates/community/
  project-dev/
  support-community/
  general-community/
  shared/
```

Shared fragments can cover common rules:

- visible Discord replies,
- context isolation,
- approval and external side effects,
- source-backed answers,
- long-task lifecycle,
- moderation escalation language.

Pack-specific files should be readable Markdown and JSON skeletons, not opaque
generated code.

## Safety Rules

- Generated profiles must preserve the existing access-control model.
- Profiles may tell Claude to ask a moderator/admin, but must not tell Claude to
  edit `access.json`.
- Profiles must distinguish draft actions from approved writes.
- Community profiles must never make private DM context available to shared
  channels by default.
- Any generated operations/deploy workflow must remain read-first and approval
  bound.

## Testing

Add focused tests for:

- supported pack ids,
- generated file list,
- placeholder replacement,
- refusal to overwrite files without confirmation,
- no generated secrets,
- setup command help output.

Keep `bun run verify` as the main verification command.

## Rollout Plan

1. Add the setup command and static templates.
2. Add tests around template discovery and rendering.
3. Document `bun run setup:community` in `README.md`.
4. Add a feature entry to `features.json`.
5. Open a PR linked to a new issue for Community Setup Packs V1.

## Future Work

- Runtime loading of `COMMUNITY_PROFILE_DIR`.
- Per-channel profile overlays.
- Discord slash command for "show active profile".
- Profile validation command.
- Import/export profile bundles.
- Community pack gallery maintained through PRs.
