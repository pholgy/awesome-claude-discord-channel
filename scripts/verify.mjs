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
const externalDocs = read('EXTERNAL_CONNECTORS.md');
const external = read('src/external.ts');
const customActionDocs = read('CUSTOM_ACTIONS.md');
const customActions = read('src/custom-actions.ts');
const knowledgeDocs = read('KNOWLEDGE_SOURCES.md');
const knowledgeSources = read('src/knowledge-sources.ts');
const fileArtifactDocs = read('FILE_ARTIFACTS.md');
const fileArtifacts = read('src/file-artifacts.ts');
const githubDocs = read('GITHUB_PROJECTS.md');
const githubProject = read('src/github-project.ts');
const tasksCalendarDocs = read('TASKS_CALENDAR.md');
const tasksCalendar = read('src/tasks-calendar.ts');
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
  /buildInboundDiscordNotification\(/,
  'Inbound Discord delivery must use the tested notification harness.',
);

assert.match(
  conversation,
  /const content = input\.content \|\| \(attachments\.length > 0 \? '\(attachment\)' : ''\)/,
  'Discord user content must remain raw unless an empty attachment-only message needs a placeholder.',
);

assert.match(
  conversation,
  /assistant_delivery_contract:/,
  'Inbound Discord messages must carry assistant-only delivery metadata.',
);

assert.match(
  conversation,
  /assistant_goal_hook:/,
  'Inbound Discord messages must carry assistant-only goal metadata.',
);

assert.match(
  conversation,
  /assistant_conversation_contract:/,
  'Inbound Discord messages must carry assistant-only conversation metadata.',
);

assert.match(
  conversation,
  /assistant_context_contract:/,
  'Inbound Discord messages must carry assistant-only context boundary metadata.',
);

assert.match(
  conversation,
  /assistant_output_contract:/,
  'Inbound Discord messages must carry assistant-only output policy metadata.',
);

assert.match(
  conversation,
  /mcp__discord__reply/,
  'Delivery metadata must explicitly require mcp__discord__reply.',
);

assert.match(
  server,
  /name: 'task_status'/,
  'MCP tools must expose Discord task lifecycle updates.',
);

assert.match(
  server,
  /name: 'start_thread'/,
  'MCP tools must expose Discord thread handoff for long shared-channel work.',
);

assert.match(server, /task:stop/);
assert.match(server, /task:continue/);
assert.match(server, /task:summarize/);
assert.match(server, /task:quiet/);
assert.match(server, /task:thread/);
assert.match(server, /task:save_context/);
assert.match(server, /task:forget_context/);
assert.match(server, /assistant_control_contract:/);
assert.match(server, /Discord access is disabled/);
assert.match(server, /isTaskControlAllowed\(access/);
assert.match(server, /activeTaskMessageIds/);
assert.match(server, /formatInactiveTaskControl/);
assert.match(server, /ThreadAutoArchiveDuration\.OneHour/);
assert.match(server, /chat_id: channelId/);

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
assert.match(conversation, /formatThreadName/);
assert.match(conversation, /save_context/);
assert.match(conversation, /forget_context/);
assert.match(conversation, /channel_type:/);
assert.match(conversation, /trigger_reason: input\.triggerReason/);
assert.match(conversation, /reply_to_message_id/);
assert.match(conversation, /thread_id/);
assert.match(conversation, /buildInboundDiscordNotification/);
assert.match(conversation, /chunkDiscordText/);
assert.match(conversation, /formatAttachmentSummary/);

assert.match(readme, /actively maintained, opinionated Discord channel plugin/);
assert.match(readme, /Project direction/);
assert.match(readme, /Metadata-only visible-reply delivery contract/);
assert.match(readme, /anthropics\/claude-plugins-official/);
assert.match(readme, /EXTERNAL_CONNECTORS\.md/);
assert.match(readme, /CUSTOM_ACTIONS\.md/);
assert.match(readme, /KNOWLEDGE_SOURCES\.md/);
assert.match(readme, /FILE_ARTIFACTS\.md/);
assert.match(readme, /GITHUB_PROJECTS\.md/);
assert.match(readme, /TASKS_CALENDAR\.md/);
assert.doesNotMatch(readme, /long-running\/resumed sessions/);

assert.match(agents, /better Claude Discord channel/);
assert.match(agents, /issue-first and PR-only/);
assert.match(agents, /assistant_delivery_contract/);

assert.ok(features.some(feature => feature.id === 'INT-08' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'INT-09' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'INT-10' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'INT-11' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'INT-12' && feature.passes === true));
assert.ok(features.some(feature => feature.id === 'EXT-01' && feature.blocked_by?.includes('INT-12')));
assert.ok(features.filter(feature => feature.phase === 'internal').every(feature => feature.passes === true));
assert.match(accessDocs, /Safe context reuse examples/);
assert.match(accessDocs, /Unsafe context reuse examples/);
assert.match(accessDocs, /Shared-channel output examples/);
assert.match(external, /ExternalActionRisk/);
assert.match(external, /externalApprovalRequired/);
assert.match(external, /buildExternalAuditFields/);
assert.match(externalDocs, /## Risk Levels/);
assert.match(externalDocs, /## Approval Rules/);
assert.match(externalDocs, /## Audit Fields/);
assert.match(externalDocs, /External action denied/);
assert.ok(features.some(feature => feature.id === 'EXT-01' && feature.passes === true));
assert.match(customActions, /normalizeCustomActionConfig/);
assert.match(customActions, /buildCustomActionRequestShape/);
assert.match(customActions, /redactCustomActionHeaders/);
assert.match(customActionDocs, /## Config Shape/);
assert.match(customActionDocs, /## Request Shape/);
assert.match(customActionDocs, /## Secret Handling/);
assert.ok(features.some(feature => feature.id === 'EXT-02' && feature.passes === true));
assert.match(knowledgeSources, /KNOWLEDGE_SOURCE_TYPES/);
assert.match(knowledgeSources, /knowledgeSourceAllowedInDiscordScope/);
assert.match(knowledgeSources, /formatKnowledgeCitations/);
assert.match(knowledgeDocs, /## Source Types/);
assert.match(knowledgeDocs, /## Citation Behavior/);
assert.match(knowledgeDocs, /## Context Isolation/);
assert.match(knowledgeDocs, /Source unavailable: not authorized for this Discord scope/);
assert.ok(features.some(feature => feature.id === 'EXT-03' && feature.passes === true));
assert.match(fileArtifacts, /ACCEPTED_FILE_ARTIFACT_WORKFLOWS/);
assert.match(fileArtifacts, /fileArtifactWithinLimits/);
assert.match(fileArtifacts, /classifyArtifactDelivery/);
assert.match(fileArtifacts, /sensitiveArtifactAllowedInScope/);
assert.match(fileArtifactDocs, /## Accepted Workflows/);
assert.match(fileArtifactDocs, /## Limits/);
assert.match(fileArtifactDocs, /## Sensitive Files/);
assert.match(fileArtifactDocs, /## External Storage Links/);
assert.ok(features.some(feature => feature.id === 'EXT-04' && feature.passes === true));
assert.match(githubProject, /githubProjectActionPolicy/);
assert.match(githubProject, /formatDiscordSourceLink/);
assert.match(githubProject, /formatGitHubChecksSummary/);
assert.match(githubDocs, /## Action Policy/);
assert.match(githubDocs, /issue\.comment/);
assert.match(githubDocs, /## Discord Source Links/);
assert.match(githubDocs, /## Auth Configuration/);
assert.ok(features.some(feature => feature.id === 'EXT-05' && feature.passes === true));
assert.match(tasksCalendar, /TASK_CALENDAR_TERMS/);
assert.match(tasksCalendar, /findMissingTaskCalendarDetails/);
assert.match(tasksCalendar, /taskCalendarVisibleInScope/);
assert.match(tasksCalendarDocs, /## Terms/);
assert.match(tasksCalendarDocs, /## Creation Rules/);
assert.match(tasksCalendarDocs, /## Visibility/);
assert.match(tasksCalendarDocs, /Reminder due:/);
assert.ok(features.some(feature => feature.id === 'EXT-06' && feature.passes === true));

console.log('verify: all assertions passed');
