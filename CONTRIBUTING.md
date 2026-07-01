# Contributing

Thanks for helping improve Awesome Claude Discord Channel.

## Contribution flow

All changes must start with an issue and land through a pull request.

1. Open an issue first.
2. Wait for discussion or maintainer acknowledgement before doing large work.
3. Open a PR that links the issue with `Closes #123`, `Fixes #123`, or `Refs #123`.
4. Keep the PR focused on one issue.
5. Make sure `bun run verify` passes locally.

Direct pushes to `main` are not accepted.

## Local checks

```sh
bun install --frozen-lockfile
bun run verify
bun build server.ts --target=bun --outfile /tmp/awesome-discord-server-check.js
```

## Scope

Good contributions:

- improve Discord delivery reliability
- improve access-control clarity
- add tests or verification around channel behavior
- improve docs for real deployment setups

Please avoid unrelated style-only rewrites. This repo tracks an upstream plugin,
so small, reviewable diffs are easier to keep current.
