/**
 * Devnexes AI v2 — Dynamic Thinking Node & Graph Planner
 * 100% LLM-driven execution graph planner. Single source of truth.
 */

import { getToolsForPlanner } from './toolRegistry.js';
import { validateExecutionGraph } from './supervisor.js';
import { streamGroqChat, FAST_MODEL } from './groqService.js';

export async function generateDynamicExecutionGraph({
  userPrompt,
  analysis,
  activeSkill,
  pastContext,
  model = FAST_MODEL,
  traceSteps,
  onStepUpdate
}) {
  const availableTools = getToolsForPlanner();
  const toolsJson = JSON.stringify(availableTools, null, 1);

  const thinkingIdx = traceSteps.length;
  traceSteps.push({ type: 'thinking', content: '', isStreaming: true, plan: null });
  if (onStepUpdate) onStepUpdate([...traceSteps]);

  const plannerSystemPrompt = `You are the Master Thinking Node (Brain & Planner) for Devnexes AI v2.
Active Skill Persona: ${activeSkill.name} (${activeSkill.category})
Detected User Intent: ${analysis.intentCategory || 'GENERAL'}

REGISTERED TOOLS AVAILABLE IN SYSTEM:
${toolsJson}

CORE PRINCIPLES (100% DYNAMIC PLANNING):
1. You are the single source of truth. You decide node counts, goals, tools, validation, reflection, retries, and output destination.
2. NO static workflows or fixed sequences exist. Generate a unique graph tailored specifically for this query.
3. Node count is 100% dynamic: simple chat queries get 1 node; coding/web apps get dynamic analysis + execution nodes; complex tasks get multi-node graphs.
4. Output Destination & Dynamic Language Selection:
   - For Letters, Emails, Applications, Essays, Reports, Summaries, or Documents in Canvas/Side Panel: set "target": "canvas", "role": "write", "tool": "codeArtifact", "language": "markdown". STRICTLY DO NOT generate HTML code, CSS, or JS wrappers for documents/letters unless user explicitly asks for HTML/Webpage!
   - For Web Apps, UI Dashboards, Interactive Webpages: set "target": "canvas", "role": "code", "tool": "codeArtifact", "language": "html".
   - For Code Algorithms, Programming Scripts (C++, Python, JS): set "target": "canvas", "role": "code", "tool": "codeArtifact", "language": "cpp" | "python" | "javascript" | etc.
   - For Diagrams, Flowcharts, Architecture Diagrams, Mind Maps, ER Diagrams: CRITICAL DIRECTIVE — Whenever user asks to DRAW or CREATE a flowchart, diagram, or mindmap, you MUST set "language": "mermaid" (or "html"), "target": "canvas", "role": "code", "tool": "codeArtifact". STRICTLY DO NOT set "language": "markdown" or "role": "write" for visual drawing requests! Markdown is ONLY for text documents, essays, letters, and emails!
   - For Simple Chat, Greetings, Conversations: set "target": "chat", "tool": null.
5. Critical Language Rule: Detect and match the user's input language (Roman Urdu, English, Urdu, etc.) in all text reasoning and chat outputs.
6. FILE MODIFICATIONS & RENAMES: When user asks to clear, empty, or rename a file (e.g. "content remove karo", "name change karo"), generate a single artifact update node whose goal is to update the target file content or title directly. STRICTLY DO NOT generate argparse Python CLI scripts or tutorial code that purports to rename or clear files.
7. ZIP ARCHIVE & FILE PACKAGING REQUESTS: When user asks for a ZIP file or archive (e.g. "zip file bana ke do", "package project"), set target: "canvas" and language: "html" or "javascript". Immediately output an interactive Web ZIP Packager application with an embedded client-side ZIP generator & instant "Download .ZIP" button. STRICTLY DO NOT generate Python "import zipfile / argparse" CLI tutorial scripts!
8. DYNAMIC SILENT MEMORY PROTOCOL: You have full awareness and memory of the user's prior conversation history. Do NOT spontaneously bring up or mention past conversation topics UNLESS the user explicitly asks about past memories, history, or prior discussions.

First write 2-3 sentences of strategic thinking reasoning, then end with ONLY the JSON graph inside <plan>...</plan>:
<plan>
{
  "selectedModel": "auto | qwen/qwen-2.5-coder-32b-instruct | deepseek/deepseek-r1 | meta-llama/llama-3.3-70b-instruct | ollama/qwen2.5-coder:7b",
  "reasoning": "One sentence explanation of model and strategy choice",
  "complexity": "simple | moderate | complex",
  "outputRouting": "canvas | chat | both",
  "reflection": true | false,
  "retryPolicy": {
    "enabled": true | false,
    "maxRetries": 3,
    "strategy": "auto_fix"
  },
  "validation": ["syntax", "completeness"],
  "nodes": [
    {
      "id": "node_1",
      "title": "Dynamic Title",
      "role": "analyze | code | write | search | synthesize | audit",
      "tool": "codeArtifact | createFile | editFile | deleteFile | readFile | listDir | executeCommand | gitStatus | gitCommit | webSearch | symbolSearch | reflectionAudit | zipAutomation | null",
      "goal": "Clear specific goal for this node",
      "language": "html | css | javascript | python | cpp | markdown | null",
      "target": "canvas | chat"
    }
  ]
}
</plan>`;

  let rawThinking = '';

  await streamGroqChat({
    messages: [
      { role: 'system', content: plannerSystemPrompt },
      ...pastContext,
      { role: 'user', content: userPrompt }
    ],
    model: model || FAST_MODEL,
    onChunk: (_, fullText) => {
      rawThinking = fullText;
      const display = fullText.replace(/<plan>[\s\S]*/i, '').replace(/```[\s\S]*$/i, '').trim();
      traceSteps[thinkingIdx].content = display;
      traceSteps[thinkingIdx].isStreaming = true;
      if (onStepUpdate) onStepUpdate([...traceSteps]);
    }
  });

  // Parse <plan> JSON
  let plan = { complexity: 'moderate', outputRouting: 'chat', nodes: [], reflection: false, retryPolicy: { enabled: false } };
  const planMatch = rawThinking.match(/<plan>([\s\S]*?)<\/plan>/i);
  if (planMatch) {
    try {
      plan = JSON.parse(planMatch[1].trim());
      if (!Array.isArray(plan.nodes)) plan.nodes = [];
    } catch (e) {
      console.warn('[PlannerEngine] plan JSON parse error:', e.message);
    }
  }

  // ── SUPERVISOR GRAPH VALIDATION ──
  // Ensure visual drawing requests get language = 'mermaid' and role = 'code'
  if (analysis.artifactLanguage === 'mermaid' || /diagram|flowchart|flow chart|mindmap|mind map|sequence diagram|er diagram/i.test(userPrompt)) {
    if (plan.nodes && plan.nodes.length > 0) {
      plan.nodes.forEach(node => {
        if (node.tool === 'codeArtifact') {
          node.language = 'mermaid';
          node.role = 'code';
        }
      });
    }
  }

  // Deduplicate redundant artifact nodes dynamically
  if (plan.nodes && plan.nodes.length > 1) {
    const artifactToolsSeen = new Set();
    plan.nodes = plan.nodes.filter(node => {
      if (node.tool === 'codeArtifact') {
        const key = `${node.tool}_${node.language || 'default'}`;
        if (artifactToolsSeen.has(key)) return false; // Deduplicate duplicate canvas generation
        artifactToolsSeen.add(key);
      }
      return true;
    });
  }

  const supResult = validateExecutionGraph(plan, availableTools);
  if (!supResult.valid) {
    console.warn('[PlannerEngine] Graph validation fallback triggered:', supResult.errors);
    // Dynamic Fallback Graph
    const isCode = analysis.needsCodeArtifact || /code|build|create|html|website|app|script|python|cpp/i.test(userPrompt);
    plan.nodes = [
      {
        id: 'node_1',
        title: isCode ? 'Build Code Solution' : 'Detailed Analysis',
        role: isCode ? 'code' : 'analyze',
        tool: isCode ? 'codeArtifact' : null,
        goal: userPrompt.slice(0, 80),
        language: analysis.artifactLanguage || (isCode ? 'html' : 'markdown'),
        target: isCode ? 'canvas' : 'chat'
      }
    ];
    plan.outputRouting = isCode ? 'canvas' : 'chat';
  }

  const cleanThinking = rawThinking.replace(/<plan>[\s\S]*/i, '').replace(/```[\s\S]*$/i, '').trim();
  traceSteps[thinkingIdx].content = cleanThinking;
  traceSteps[thinkingIdx].plan = plan;
  traceSteps[thinkingIdx].isStreaming = false;
  if (onStepUpdate) onStepUpdate([...traceSteps]);

  return { thinkingText: cleanThinking, plan };
}
