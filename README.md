# Awesome Claude Discord Channel

An actively maintained, opinionated Discord channel plugin for Claude Code.

This project exists to make Claude-in-Discord feel reliable enough for real
daily use: visible replies, predictable access control, useful history tools,
attachments on demand, and room to add operational features that the basic
channel experience does not cover yet.

It started from the Apache-2.0 Discord plugin in
`anthropics/claude-plugins-official`, then turns that baseline into a public,
patchable channel implementation for people who want to run and improve their
own Claude Discord assistant.

## Project direction

The goal is not to carry a one-off bug workaround. The goal is a better Discord
channel for Claude Code:

- reliable Discord-visible replies
- clear access-control behavior
- good support for guild channels, DMs, attachments, and history
- practical deployment docs for local, container, and always-on bot setups
- small, reviewable improvements that can track upstream when it makes sense

One reliability feature included here is an assistant-only delivery contract on
inbound Discord messages. It reminds Claude, through channel metadata, that
normal transcript text is not visible to Discord and that visible responses must
go through `mcp__discord__reply`. This avoids injecting visible
`<delivery_contract>` tags into user content while still keeping the delivery
rule close to the Discord message.

## What is included

- Discord gateway bridge for Claude Code
- Built-in access control and pairing flow
- Tools: `reply`, `task_status`, `start_thread`, `react`, `edit_message`, `fetch_messages`, `download_attachment`
- Attachment download on demand
- Typing indicator while Claude is working
- Metadata-only visible-reply delivery contract

The MCP server key remains `discord`, so existing `/discord:*` workflows and
tool names stay familiar.

## Quick setup

See [ACCESS.md](./ACCESS.md) for the full access-control model.

1. Create a Discord application and bot in the
   [Discord Developer Portal](https://discord.com/developers/applications).
2. Enable **Message Content Intent**.
3. Invite the bot to a server with:
   - View Channels
   - Send Messages
   - Send Messages in Threads
   - Read Message History
   - Attach Files
   - Add Reactions
4. Install dependencies:

   ```sh
   bun install
   ```

5. Provide `DISCORD_BOT_TOKEN` through the environment or write it to:

   ```text
   ~/.claude/channels/discord/.env
   ```

   with:

   ```text
   DISCORD_BOT_TOKEN=your-token-here
   ```

6. Run the channel server from Claude Code using your normal plugin/channel
   setup. For custom deployments, point the `discord` MCP server command at:

   ```sh
   bun run --cwd /path/to/awesome-claude-discord-channel --silent start
   ```

## Verification

Run:

```sh
bun run verify
```

The verifier checks that:

- `server.ts` keeps Discord user content as the raw message content
- `assistant_delivery_contract` is present in channel metadata
- visible `<delivery_contract>` tags are not injected into user content
- plugin metadata and package metadata match this standalone repo

## Contributing

Contributions are issue-first and PR-only:

1. Open an issue for the bug or feature.
2. Open a PR that links the issue with `Closes #123`, `Fixes #123`, or `Refs #123`.
3. Wait for review; direct pushes to `main` are blocked.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Provenance

This repo is derived from the Apache-2.0 licensed Discord plugin in
`anthropics/claude-plugins-official`, under `external_plugins/discord`.

This repo keeps the upstream license and attribution, while intentionally taking
its own product direction for a more capable Discord channel experience.

## License

Apache-2.0. See [LICENSE](./LICENSE).
