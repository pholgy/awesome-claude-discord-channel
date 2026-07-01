import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const server = read('server.ts');
const packageJson = JSON.parse(read('package.json'));
const pluginJson = JSON.parse(read('.claude-plugin/plugin.json'));
const readme = read('README.md');
const agents = read('AGENTS.md');
const workflow = read('.github/workflows/verify.yml');

assert.equal(packageJson.name, 'awesome-claude-discord-channel');
assert.equal(pluginJson.name, 'awesome-discord-channel');
assert.equal(packageJson.license, 'Apache-2.0');
assert.equal(packageJson.scripts.verify, 'bun scripts/verify.mjs');
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
  /mcp__discord__reply/,
  'Delivery metadata must explicitly require mcp__discord__reply.',
);

assert.doesNotMatch(
  server,
  /<delivery_contract>/,
  'Do not inject visible delivery_contract tags into user content.',
);

assert.match(readme, /actively maintained, opinionated Discord channel plugin/);
assert.match(readme, /Project direction/);
assert.match(readme, /Metadata-only visible-reply delivery contract/);
assert.match(readme, /anthropics\/claude-plugins-official/);
assert.doesNotMatch(readme, /long-running\/resumed sessions/);

assert.match(agents, /better Claude Discord channel/);
assert.match(agents, /issue-first and PR-only/);
assert.match(agents, /assistant_delivery_contract/);

console.log('verify: all assertions passed');
