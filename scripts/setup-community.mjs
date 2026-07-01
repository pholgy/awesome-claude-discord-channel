#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import {
  COMMUNITY_CHANNEL_KEYS,
  DEFAULT_COMMUNITY_CHANNELS,
  parseWorkflowList,
  planProfileWrites,
  renderCommunityProfile,
  validateCommunitySetupInput,
} from '../src/community-setup.ts'

const CHANNEL_FLAG_CONFIG = [
  { key: 'support', flag: '--support-channel', help: 'Support channel name or ID.' },
  { key: 'dev', flag: '--dev-channel', help: 'Dev/build channel name or ID.' },
  { key: 'announcements', flag: '--announcements-channel', help: 'Announcements channel name or ID.' },
  { key: 'feedback', flag: '--feedback-channel', help: 'Feedback channel name or ID.' },
  { key: 'moderation', flag: '--moderation-channel', help: 'Moderation/escalation channel name or ID.' },
]

function help() {
  return `Community Setup Packs

Usage:
  bun run setup:community
  bun run setup:community -- --pack project-dev --server-name "Example" --output ./community-profile --enable github,docs

Options:
  --help                 Show this help.
  --pack <id>            project-dev, support-community, or general-community.
  --server-name <name>   Discord server/community name.
  --output <dir>         Output directory. Defaults to ./community-profile.
  --enable <list>        Comma-separated workflows: github,docs,files,tasks,operations.
  --support-channel <v>  Support channel name or ID.
  --dev-channel <v>      Dev/build channel name or ID.
  --announcements-channel <v>
                         Announcements channel name or ID.
  --feedback-channel <v> Feedback channel name or ID.
  --moderation-channel <v>
                         Moderation/escalation channel name or ID.
  --force                Overwrite generated target files. V1 requires --force; no interactive overwrite confirmation is shown.
`
}

function parseArgs(argv) {
  const out = {
    packId: undefined,
    serverName: undefined,
    outputDir: './community-profile',
    enabledWorkflows: [],
    channels: {},
    force: false,
    help: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help') out.help = true
    else if (arg === '--force') out.force = true
    else if (arg === '--pack') out.packId = argv[++i]
    else if (arg === '--server-name') out.serverName = argv[++i]
    else if (arg === '--output') out.outputDir = argv[++i]
    else if (arg === '--enable') out.enabledWorkflows = parseWorkflowList(argv[++i])
    else {
      const channelFlag = CHANNEL_FLAG_CONFIG.find(config => config.flag === arg)
      if (channelFlag) {
        out.channels[channelFlag.key] = argv[++i]
      } else {
        throw new Error(`unknown argument: ${arg}`)
      }
    }
  }

  return out
}

function missingRequiredFlags(args) {
  const missing = []
  if (!args.packId) missing.push('--pack')
  if (!args.serverName?.trim()) missing.push('--server-name')
  return missing
}

function canPrompt() {
  return Boolean(stdin.isTTY && stdout.isTTY)
}

async function promptWithDefault(rl, prompt, defaultValue) {
  const answer = await rl.question(`${prompt} [${defaultValue}]: `)
  return answer.trim() ? answer : defaultValue
}

async function promptForMissingArgs(args) {
  if (args.packId && args.serverName) return args

  const rl = createInterface({ input: stdin, output: stdout })
  try {
    const prompted = { ...args }
    if (!prompted.packId) {
      prompted.packId = await rl.question('Community pack (project-dev/support-community/general-community): ')
    }
    if (!prompted.serverName) {
      prompted.serverName = await rl.question('Server/community name: ')
    }
    if (prompted.enabledWorkflows.length === 0) {
      const workflows = await rl.question('Enabled workflows (comma-separated, optional): ')
      prompted.enabledWorkflows = parseWorkflowList(workflows)
    }
    for (const channelKey of COMMUNITY_CHANNEL_KEYS) {
      if (prompted.channels[channelKey]) {
        continue
      }

      const channelConfig = CHANNEL_FLAG_CONFIG.find(config => config.key === channelKey)
      prompted.channels[channelKey] = await promptWithDefault(
        rl,
        channelConfig.help.replace(/ name or ID\.$/, ''),
        DEFAULT_COMMUNITY_CHANNELS[channelKey],
      )
    }
    return prompted
  } finally {
    rl.close()
  }
}

function existingTargetFiles(outputDir, files) {
  return new Set(
    files
      .map(file => join(outputDir, file.relativePath).replace(/\\/g, '/'))
      .filter(path => existsSync(path)),
  )
}

try {
  let args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(help())
    process.exit(0)
  }
  const missingFlags = missingRequiredFlags(args)
  if (missingFlags.length > 0) {
    if (!canPrompt()) {
      process.stderr.write(
        `setup:community failed:\n- missing required arguments in non-interactive mode: ${missingFlags.join(', ')}\n`,
      )
      process.stderr.write('Provide the missing flags or run the command in an interactive terminal.\n')
      process.exit(1)
    }

    args = await promptForMissingArgs(args)
  }

  const input = {
    packId: args.packId,
    serverName: args.serverName,
    outputDir: args.outputDir,
    enabledWorkflows: args.enabledWorkflows,
    channels: args.channels,
  }
  const errors = validateCommunitySetupInput(input)
  if (errors.length > 0) {
    process.stderr.write(`setup:community failed:\n${errors.map(error => `- ${error}`).join('\n')}\n`)
    process.exit(1)
  }

  const files = renderCommunityProfile(input)
  const plan = planProfileWrites({
    outputDir: input.outputDir,
    files,
    existingFiles: existingTargetFiles(input.outputDir, files),
    force: args.force,
  })

  if (!plan.ok) {
    process.stderr.write(`setup:community would overwrite existing files:\n${plan.existing.map(path => `- ${path}`).join('\n')}\n`)
    process.stderr.write('Run again with --force to overwrite the generated profile files.\n')
    process.exit(1)
  }

  for (const write of plan.writes) {
    mkdirSync(dirname(write.path), { recursive: true })
    writeFileSync(write.path, write.content)
  }

  process.stdout.write(`Community profile written to ${input.outputDir}\n`)
  process.stdout.write('Next: review CLAUDE.community.md before deploying it with your bot.\n')
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  process.stderr.write(`setup:community failed: ${message}\n`)
  process.exit(1)
}
