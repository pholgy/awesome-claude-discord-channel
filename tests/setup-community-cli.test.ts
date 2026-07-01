import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, test } from 'bun:test'

function runSetup(args: string[]) {
  return Bun.spawnSync({
    cmd: [process.execPath, 'scripts/setup-community.mjs', ...args],
    stdout: 'pipe',
    stderr: 'pipe',
  })
}

async function runSetupWithTimeout(
  args: string[],
  options: { stdin?: 'pipe' | 'ignore' } = {},
) {
  const proc = Bun.spawn({
    cmd: [process.execPath, 'scripts/setup-community.mjs', ...args],
    stdin: options.stdin,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const result = await Promise.race([
    proc.exited.then(async exitCode => ({
      timedOut: false as const,
      exitCode,
      stdout: await new Response(proc.stdout).text(),
      stderr: await new Response(proc.stderr).text(),
    })),
    new Promise(resolve =>
      setTimeout(() => resolve({ timedOut: true as const }), 1500),
    ),
  ])

  if (result.timedOut) {
    proc.kill()
  }

  return result
}

function tempProfileDir(name: string): string {
  const dir = join(tmpdir(), `awesome-discord-${name}-${Date.now()}`)
  rmSync(dir, { recursive: true, force: true })
  return dir
}

function tempRelativeProfileDir(name: string): string {
  const dir = `./tmp/awesome-discord-${name}-${Date.now()}`
  rmSync(dir, { recursive: true, force: true })
  return dir
}

describe('setup-community CLI', () => {
  test('prints help', () => {
    const result = runSetup(['--help'])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString()).toContain('bun run setup:community')
    expect(result.stdout.toString()).toContain('--pack project-dev')
    expect(result.stdout.toString()).toContain('--support-channel <v>')
    expect(result.stdout.toString()).toContain('V1 requires --force')
  })

  test('generates a profile non-interactively', () => {
    const output = tempProfileDir('generate')
    const result = runSetup([
      '--pack', 'project-dev',
      '--server-name', 'Axtra Dev',
      '--output', output,
      '--enable', 'github,docs',
    ])

    expect(result.exitCode).toBe(0)
    expect(readFileSync(join(output, 'CLAUDE.community.md'), 'utf8')).toContain('Community name: "Axtra Dev"')
    expect(readFileSync(join(output, '.env.example'), 'utf8')).toContain('CLAUDE_AUTO_UPDATE=false')
    rmSync(output, { recursive: true, force: true })
  })

  test('refuses overwrite without force and leaves existing file unchanged', () => {
    const output = tempProfileDir('overwrite')
    mkdirSync(output, { recursive: true })
    const profile = join(output, 'CLAUDE.community.md')
    writeFileSync(profile, 'existing\n')

    const result = runSetup([
      '--pack', 'project-dev',
      '--server-name', 'Axtra Dev',
      '--output', output,
    ])

    expect(result.exitCode).toBe(1)
    expect(result.stderr.toString()).toContain('would overwrite existing files')
    expect(readFileSync(profile, 'utf8')).toBe('existing\n')
    rmSync(output, { recursive: true, force: true })
  })

  test('refuses overwrite for normalized relative output paths and writes nothing else', () => {
    const output = tempRelativeProfileDir('normalized-overwrite')
    mkdirSync(output, { recursive: true })
    const profile = join(output, 'CLAUDE.community.md')
    writeFileSync(profile, 'existing\n')

    const result = runSetup([
      '--pack', 'project-dev',
      '--server-name', 'Axtra Dev',
      '--output', output,
    ])

    expect(result.exitCode).toBe(1)
    expect(result.stderr.toString()).toContain('would overwrite existing files')
    expect(readFileSync(profile, 'utf8')).toBe('existing\n')
    expect(readdirSync(output)).toEqual(['CLAUDE.community.md'])
    rmSync(output, { recursive: true, force: true })
  })

  test('overwrites with force', () => {
    const output = tempProfileDir('force')
    mkdirSync(output, { recursive: true })
    const profile = join(output, 'CLAUDE.community.md')
    writeFileSync(profile, 'existing\n')

    const result = runSetup([
      '--pack', 'general-community',
      '--server-name', 'Creators',
      '--output', output,
      '--force',
    ])

    expect(result.exitCode).toBe(0)
    expect(readFileSync(profile, 'utf8')).toContain('Community name: "Creators"')
    rmSync(output, { recursive: true, force: true })
  })

  test('writes non-interactive channel flags into channels.example.json with safe JSON escaping', () => {
    const output = tempProfileDir('channels')
    const result = runSetup([
      '--pack', 'support-community',
      '--server-name', 'Support Hub',
      '--output', output,
      '--support-channel', '#support "tier-1"',
      '--dev-channel', 'dev\\core',
      '--announcements-channel', '<#123456789012345678>',
      '--feedback-channel', 'feedback (beta)',
      '--moderation-channel', '987654321098765432',
    ])

    expect(result.exitCode).toBe(0)

    const channelsFile = readFileSync(join(output, 'channels.example.json'), 'utf8')
    const channelsJson = JSON.parse(channelsFile)

    expect(channelsJson.channels).toEqual({
      support: '#support "tier-1"',
      dev: 'dev\\core',
      announcements: '<#123456789012345678>',
      feedback: 'feedback (beta)',
      moderation: '987654321098765432',
    })
    expect(channelsFile).toContain('\\"tier-1\\"')
    expect(channelsFile).toContain('dev\\\\core')
    rmSync(output, { recursive: true, force: true })
  })

  test('fails fast when required args are missing in non-interactive mode', async () => {
    const result = await runSetupWithTimeout([], { stdin: 'pipe' })

    expect(result.timedOut).toBe(false)
    if (result.timedOut) {
      return
    }

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('missing required arguments in non-interactive mode')
    expect(result.stderr).toContain('--pack')
    expect(result.stderr).toContain('--server-name')
  })

  test('fails fast when required args are missing and stdin is closed', async () => {
    const result = await runSetupWithTimeout([], { stdin: 'ignore' })

    expect(result.timedOut).toBe(false)
    if (result.timedOut) {
      return
    }

    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('missing required arguments in non-interactive mode')
    expect(result.stderr).toContain('--pack')
    expect(result.stderr).toContain('--server-name')
  })
})
