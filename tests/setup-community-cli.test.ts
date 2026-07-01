import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

function tempProfileDir(name: string): string {
  const dir = join(tmpdir(), `awesome-discord-${name}-${Date.now()}`)
  rmSync(dir, { recursive: true, force: true })
  return dir
}

describe('setup-community CLI', () => {
  test('prints help', () => {
    const result = runSetup(['--help'])
    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString()).toContain('bun run setup:community')
    expect(result.stdout.toString()).toContain('--pack project-dev')
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
    expect(readFileSync(join(output, 'CLAUDE.community.md'), 'utf8')).toContain('Community name: `Axtra Dev`')
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
    expect(readFileSync(profile, 'utf8')).toContain('Community name: `Creators`')
    rmSync(output, { recursive: true, force: true })
  })
})
