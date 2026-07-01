#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import {
  parseWorkflowList,
  planProfileWrites,
  renderCommunityProfile,
  validateCommunitySetupInput,
} from '../src/community-setup.ts'

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
  --force                Overwrite generated target files.
`
}

function parseArgs(argv) {
  const out = {
    packId: undefined,
    serverName: undefined,
    outputDir: './community-profile',
    enabledWorkflows: [],
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
    else throw new Error(`unknown argument: ${arg}`)
  }

  return out
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
    return prompted
  } finally {
    rl.close()
  }
}

function existingTargetFiles(outputDir, files) {
  return new Set(
    files
      .map(file => `${outputDir.replace(/\\/g, '/')}/${file.relativePath}`)
      .filter(path => existsSync(path)),
  )
}

try {
  let args = parseArgs(process.argv.slice(2))
  if (args.help) {
    process.stdout.write(help())
    process.exit(0)
  }
  args = await promptForMissingArgs(args)

  const input = {
    packId: args.packId,
    serverName: args.serverName,
    outputDir: args.outputDir,
    enabledWorkflows: args.enabledWorkflows,
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
