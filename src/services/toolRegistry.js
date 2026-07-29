/**
 * Devnexes AI v2 — Dynamic Tool Registry & Extension Pool
 * Extensible tool registry where capabilities register metadata for the Thinking Node.
 */

const toolMap = new Map();

/**
 * Register a new tool extension into the dynamic registry
 */
export function registerTool(toolDef) {
  if (!toolDef || !toolDef.id) return;
  toolMap.set(toolDef.id, {
    id: toolDef.id,
    name: toolDef.name || toolDef.id,
    description: toolDef.description || '',
    category: toolDef.category || 'general',
    capabilities: toolDef.capabilities || [],
    risk: toolDef.risk || 'low',
    supportsParallel: toolDef.supportsParallel !== false,
    parameters: toolDef.parameters || [],
    handler: toolDef.handler || null
  });
}

/**
 * Get formatted JSON schema of all registered tools for the Thinking Node
 */
export function getToolsForPlanner() {
  const toolsList = [];
  for (const tool of toolMap.values()) {
    toolsList.push({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      capabilities: tool.capabilities,
      risk: tool.risk,
      supportsParallel: tool.supportsParallel,
      parameters: tool.parameters
    });
  }
  return toolsList;
}

/**
 * Lookup tool definition by ID
 */
export function getToolById(id) {
  return toolMap.get(id) || null;
}

// ── REGISTER DYNAMIC EXTENSION TOOLS ────────────────────────────────────────

// 1. Code Artifact & Canvas Extension
registerTool({
  id: 'codeArtifact',
  name: 'Code & Document Canvas Builder',
  description: 'Generates complete production code apps or formal markdown documents into Side Panel Canvas',
  category: 'generation',
  capabilities: ['code', 'write', 'html', 'css', 'javascript', 'python', 'cpp', 'markdown'],
  risk: 'low',
  supportsParallel: false,
  parameters: ['language', 'title', 'codeGoal']
});

// 2. File Creation Extension
registerTool({
  id: 'createFile',
  name: 'Create File Extension',
  description: 'Creates a new file in the project workspace with specified content',
  category: 'filesystem',
  capabilities: ['write', 'create', 'filesystem'],
  risk: 'medium',
  supportsParallel: false,
  parameters: ['filename', 'content']
});

// 3. File Editing Extension
registerTool({
  id: 'editFile',
  name: 'Edit File Extension',
  description: 'Modifies or replaces code content in an existing file',
  category: 'filesystem',
  capabilities: ['edit', 'modify', 'replace'],
  risk: 'medium',
  supportsParallel: false,
  parameters: ['filename', 'targetContent', 'replacementContent']
});

// 4. File Deletion Extension
registerTool({
  id: 'deleteFile',
  name: 'Delete File Extension',
  description: 'Deletes a file from project workspace',
  category: 'filesystem',
  capabilities: ['delete', 'remove'],
  risk: 'high',
  supportsParallel: false,
  parameters: ['filename']
});

// 5. Read File Extension
registerTool({
  id: 'readFile',
  name: 'Read File Extension',
  description: 'Reads contents of an existing project file',
  category: 'filesystem',
  capabilities: ['read', 'inspect'],
  risk: 'low',
  supportsParallel: true,
  parameters: ['filename']
});

// 6. List Directory Extension
registerTool({
  id: 'listDir',
  name: 'List Directory Extension',
  description: 'Lists files and folders in project directory',
  category: 'filesystem',
  capabilities: ['list', 'browse'],
  risk: 'low',
  supportsParallel: true,
  parameters: ['path']
});

// 7. Execute Command Extension (Terminal CLI)
registerTool({
  id: 'executeCommand',
  name: 'Terminal Command Executor',
  description: 'Executes shell terminal commands (e.g. npm test, git status, build commands)',
  category: 'terminal',
  capabilities: ['execute', 'cmd', 'terminal', 'shell'],
  risk: 'high',
  supportsParallel: false,
  parameters: ['command']
});

// 8. Git Status Extension
registerTool({
  id: 'gitStatus',
  name: 'Git Status Inspector',
  description: 'Inspects modified, untracked, and staged git files',
  category: 'git',
  capabilities: ['git', 'status'],
  risk: 'low',
  supportsParallel: true,
  parameters: []
});

// 9. Git Commit Extension
registerTool({
  id: 'gitCommit',
  name: 'Git Commit Extension',
  description: 'Commits staged project changes with a commit message',
  category: 'git',
  capabilities: ['git', 'commit'],
  risk: 'medium',
  supportsParallel: false,
  parameters: ['message']
});

// 10. Live Web Search Extension
registerTool({
  id: 'webSearch',
  name: 'Live Web Search Extension',
  description: 'Performs real-time web search for live data, documentation, and internet facts',
  category: 'research',
  capabilities: ['search', 'browse', 'webData'],
  risk: 'low',
  supportsParallel: true,
  parameters: ['query']
});

// 11. Code Symbol Search Extension
registerTool({
  id: 'symbolSearch',
  name: 'Code Symbol Search',
  description: 'Searches definitions, functions, and class symbols across the codebase',
  category: 'intelligence',
  capabilities: ['search', 'symbol', 'codebase'],
  risk: 'low',
  supportsParallel: true,
  parameters: ['symbolName']
});

// 12. Self-Reflection Audit Extension
registerTool({
  id: 'reflectionAudit',
  name: 'Self-Reflection Reviewer',
  description: 'Audits generated output completeness and quality',
  category: 'quality',
  capabilities: ['reflection', 'audit', 'validation'],
  risk: 'low',
  supportsParallel: false,
  parameters: ['targetOutput', 'userPrompt']
});

// 13. ZIP Automation Extension
registerTool({
  id: 'zipAutomation',
  name: 'ZIP Archive & Automation Extension',
  description: 'Automates creation, compression, packaging, and extraction of project files into ZIP archives',
  category: 'automation',
  capabilities: ['zip', 'compress', 'archive', 'extract', 'package', 'automation'],
  risk: 'low',
  supportsParallel: false,
  parameters: ['sourceFiles', 'outputZipName', 'action']
});
