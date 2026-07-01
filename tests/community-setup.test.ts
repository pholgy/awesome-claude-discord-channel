import { describe, expect, test } from 'bun:test'
import {
  SUPPORTED_COMMUNITY_PACKS,
  TARGET_PROFILE_FILES,
  parseWorkflowList,
  validateCommunitySetupInput,
} from '../src/community-setup.ts'

describe('community setup core', () => {
  test('declares the first supported community packs', () => {
    expect(SUPPORTED_COMMUNITY_PACKS.map(pack => pack.id)).toEqual([
      'project-dev',
      'support-community',
      'general-community',
    ])
  })

  test('declares the generated profile file set', () => {
    expect(TARGET_PROFILE_FILES).toEqual([
      'CLAUDE.community.md',
      'channels.example.json',
      'workflows.md',
      'moderation.md',
      '.env.example',
    ])
  })

  test('parses workflow toggles from comma-separated CLI input', () => {
    expect(parseWorkflowList('github,docs,files')).toEqual(['github', 'docs', 'files'])
    expect(parseWorkflowList('')).toEqual([])
  })

  test('rejects invalid workflow toggles', () => {
    expect(() => parseWorkflowList('github,unknown')).toThrow('invalid workflow: unknown')
  })

  test('validates required setup input', () => {
    expect(validateCommunitySetupInput({})).toEqual([
      'packId is required',
      'serverName is required',
      'outputDir is required',
    ])
  })
})
