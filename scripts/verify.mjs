import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const server = read('server.ts');
const conversation = read('src/conversation.ts');
const packageJson = JSON.parse(read('package.json'));
const pluginJson = JSON.parse(read('.claude-plugin/plugin.json'));
const features = JSON.parse(read('features.json'));
const readme = read('README.md');
const agents = read('AGENTS.md');
const accessDocs = read('ACCESS.md');
const workflow = read('.github/workflows/verify.yml');

assert.equal(packageJson.name, 'awesome-claude-discord-channel');
assert.equal(pluginJson.name, 'awesome-discord-channel');
assert.equal(packageJson.license, 'Apache-2.0');
assert.equal(packageJson.scripts.verify, 'bun test && bun scripts/verify.mjs');
assert.equal(packageJson.scripts.test, 'bun run verify');
assert.match(workflow, /bun run verify/);
assert.doesNotMatch(workflow, /npm test|actions\/setup-node/);

assert.match(
  server,
  /const content = msg\.content \|\| \(atts\.length > 0 \? '\(attachment\)' : ''\)/,
  'Discord user content must remain the raw message content.',
);

assert.match(
  server,
  /assistant_delivery_contract:/,
  'Inbound Discord messages must carry assistant-only delivery metadata.',
);

assert.match(
  server,
  /assistant_goal_hook:/,
  'Inbound Discord messages must carry assistant-only goal metadata.',
);

assert.match(
  server,
  /assistant_conversation_contract:/,
  'Inbound Discord messages must carry assistant-only conversation metadata.',
);

assert.match(
  server,
  /assistant_context_contract:/,
  'Inbound Discord messages must carry assistant-only context boundary metadata.',
);

assert.match(
  server,
  /assistant_output_contract:/,
  'Inbound Discord messages must carry assistant-only output policy metadata.',
);

assert.match(
  server,
  /mcp__discord__reply/,
  'Delivery metadata must explicitly require mcp__discord__reply.',
);

assert.match(
  server,
  /name: 'task_status'/,
  'MCP tools must expose Discord task lifecycle updates.',
);

assert.match(server, /task:stop/);
assert.match(server, /task:continue/);
assert.match(server, /task:summarize/);
assert.match(server, /task:quiet/);
assert.match(server, /assistant_control_contract:/);
assert.match(server, /Discord access is disabled/);
assert.match(server, /isTaskControlAllowed\(access/);
assert.match(server, /activeTaskMessageIds/);
assert.match(server, /formatInactiveTaskControl/);

assert.doesNotMatch(
  server,
  /<delivery_contract>/,
  'Do not inject visible delivery_contract tags into user content.',
);

assert.match(conversation, /conversation_scope:/);
assert.match(conversation, /conversation_scope_id:/);
assert.match(conversation, /context_boundary:/);
assert.match(conversation, /context_visibility:/);
assert.match(conversation, /output_profile:/);
assert.match(conversation, /formatTaskStatus/);
assert.match(conversation, /isTaskStatus/);
assert.match(conversation, /isTaskControlAction/);
assert.match(conversation, /isTaskControlAllowed/);
assert.match(conversation, /formatInactiveTaskControl/);
assert.match(conversation, /channel_type:/);
assert.match(conversation, /trigger_reason: input\.triggerReason/);
assert.match(conversation, /reply_to_message_id/);
assert.match(conversation, /thread_id/);

assert.match(readme, /actively maintained, opinionated Discord channel plugin/);
assert.match(readme, /Project direction/);
assert.match(readme, /Metadata-only visible-reply delivery contract/);
assert.match(readme, /anthropics\/claude-plugins-official/);
assert.doesNotMatch(readme, /long-running\/resumed sessions/);

assert.match(agents, /better Claude Discord channel/);
assert.match(agents, /issue-first and PR-only/);
assert.match(agents, /assistant_delivery_contract/);

assert.ok(features.some(feature => feature.id === 'INT-08' && feature.passes === false));
assert.ok(features.some(feature => feature.id === 'INT-09' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'INT-12' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'EXT-01' && feature.blocked_by?.includes('INT-12')));
assert.match(accessDocs, /Safe context reuse examples/);
assert.match(accessDocs, /Unsafe context reuse examples/);
assert.match(accessDocs, /Shared-channel output examples/);

console.log('verify: all assertions passed');
