# Agent Notes

## Project Direction

This repo is an actively maintained, opinionated Discord channel plugin for
Claude Code. Do not frame it as only a workaround for one upstream bug or one
long-running-session issue.

The product goal is a better Claude Discord channel:

- reliable Discord-visible replies
- clear access control
- useful guild, DM, attachment, and history behavior
- practical deployment support for always-on assistants
- small improvements that can still track upstream when useful

The current `assistant_delivery_contract` metadata is one reliability feature,
not the whole purpose of the repo.

## Contribution Workflow

This repo is issue-first and PR-only.

- Open or reference a GitHub issue before changing code or docs.
- Work on a feature branch, not `main`.
- PRs must link an issue with `Closes #N`, `Fixes #N`, `Resolves #N`, or `Refs #N`.
- Do not push directly to `main`.

## Verification

Run these before claiming a change is ready:

```sh
bun install --frozen-lockfile
npm test
bun build server.ts --target=bun --outfile /tmp/awesome-discord-server-check.js
```

On Windows PowerShell, use a temp path for the build output:

```powershell
bun build server.ts --target=bun --outfile $env:TEMP\awesome-discord-server-check.js
```

## Upstream And Attribution

The code is derived from the Apache-2.0 Discord plugin in
`anthropics/claude-plugins-official`. Preserve `LICENSE`, `NOTICE`, and clear
provenance when changing docs or packaging.

Prefer small, understandable diffs so upstream changes can be compared and
ported later.
