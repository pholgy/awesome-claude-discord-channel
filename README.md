# Awesome Claude Discord Channel

A standalone Discord channel plugin for Claude Code, extracted from the official
Discord channel plugin and hardened for long-running/resumed sessions.

The main difference from upstream is a delivery contract on inbound Discord
messages: Claude is reminded, through assistant-only channel metadata, that
normal transcript text is not visible to Discord and that visible responses must
go through `mcp__discord__reply`.

## Why this exists

In a long-running deployment, a Discord message can be processed by Claude Code
and produce normal assistant text while never calling the Discord `reply` tool.
The transcript looks answered, but the Discord user sees nothing.

This fork keeps the official plugin shape, access model, and tools, then adds a
metadata-only reminder close to each inbound Discord message:

- no visible `<delivery_contract>` tag in user content
- no change to Discord message text
- explicit `mcp__discord__reply` requirement in channel metadata
- explicit "ack first" guidance for tool/code/web/file/heavy work

Upstream context: https://github.com/anthropics/claude-plugins-official/issues/3569

## What is included

- Discord gateway bridge for Claude Code
- Built-in access control and pairing flow
- Tools: `reply`, `react`, `edit_message`, `fetch_messages`, `download_attachment`
- Attachment download on demand
- Typing indicator while Claude is working
- Hardened visible-reply delivery metadata

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
npm test
```

The verifier checks that:

- `server.ts` keeps Discord user content as the raw message content
- `assistant_delivery_contract` is present in channel metadata
- visible `<delivery_contract>` tags are not injected into user content
- plugin metadata and package metadata match this standalone repo

## Provenance

This repo is derived from the Apache-2.0 licensed Discord plugin in
`anthropics/claude-plugins-official`, under `external_plugins/discord`.

The original plugin remains the best default for most users. This repo is for
custom deployments that want a public, patchable Discord channel with stronger
reply-delivery behavior.

## License

Apache-2.0. See [LICENSE](./LICENSE).
